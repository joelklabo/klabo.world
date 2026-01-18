#!/usr/bin/env node
// Annotation watcher daemon
// Polls Prisma for annotation changes and broadcasts via Unix socket
// Run with: node packages/content/dist/watcher/daemon.js
import * as net from 'node:net';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { SqliteAnnotationAdapter } from '../core/annotations/sqlite-adapter.js';
const SOCKET_PATH = process.env.SOCKET_PATH || '/tmp/klaboworld-annotations.sock';
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '500', 10);
const DATABASE_URL = process.env.DATABASE_URL || 'file:./app/prisma/dev.db';
const clients = new Set();
const state = {
    lastCheck: new Date(),
    knownAnnotations: new Map(),
};
// Broadcast message to all connected clients
function broadcast(changes) {
    if (changes.length === 0)
        return;
    const message = JSON.stringify({ type: 'annotations', changes }) + '\n';
    console.log(`[${new Date().toISOString()}] Broadcasting ${changes.length} changes`);
    for (const client of clients) {
        try {
            client.write(message);
        }
        catch (error) {
            console.error('Error writing to client:', error);
            clients.delete(client);
        }
    }
}
// Poll for changes
async function pollForChanges(db) {
    const changes = [];
    try {
        // Get all annotations
        const annotations = await db.findMany({
            where: {},
            orderBy: { createdAt: 'asc' },
        });
        const currentIds = new Set();
        for (const annotation of annotations) {
            currentIds.add(annotation.id);
            const known = state.knownAnnotations.get(annotation.id);
            if (!known) {
                // New annotation
                changes.push({
                    type: 'created',
                    annotationId: annotation.id,
                    draftSlug: annotation.draftSlug,
                    timestamp: annotation.createdAt,
                });
                state.knownAnnotations.set(annotation.id, {
                    updatedAt: annotation.updatedAt,
                    status: annotation.status,
                });
            }
            else if (annotation.updatedAt.getTime() > known.updatedAt.getTime() ||
                annotation.status !== known.status) {
                // Updated annotation
                changes.push({
                    type: 'updated',
                    annotationId: annotation.id,
                    draftSlug: annotation.draftSlug,
                    timestamp: annotation.updatedAt,
                });
                state.knownAnnotations.set(annotation.id, {
                    updatedAt: annotation.updatedAt,
                    status: annotation.status,
                });
            }
        }
        // Check for deleted annotations
        for (const [id, _data] of state.knownAnnotations) {
            if (!currentIds.has(id)) {
                changes.push({
                    type: 'deleted',
                    annotationId: id,
                    draftSlug: 'unknown', // Can't determine after deletion
                    timestamp: new Date(),
                });
                state.knownAnnotations.delete(id);
            }
        }
        state.lastCheck = new Date();
    }
    catch (error) {
        console.error('Error polling database:', error);
    }
    return changes;
}
// Initialize known state
async function initializeState(db) {
    try {
        const annotations = await db.findMany({
            where: {},
            orderBy: { createdAt: 'asc' },
        });
        for (const annotation of annotations) {
            state.knownAnnotations.set(annotation.id, {
                updatedAt: annotation.updatedAt,
                status: annotation.status,
            });
        }
        console.log(`[${new Date().toISOString()}] Initialized with ${annotations.length} annotations`);
    }
    catch (error) {
        console.error('Error initializing state:', error);
    }
}
// Start the watcher
async function main() {
    console.log(`[${new Date().toISOString()}] Annotation watcher starting...`);
    console.log(`  Socket: ${SOCKET_PATH}`);
    console.log(`  Poll interval: ${POLL_INTERVAL}ms`);
    console.log(`  Database: ${DATABASE_URL}`);
    // Parse database path
    const dbPath = DATABASE_URL.replace(/^file:/, '');
    const absoluteDbPath = path.isAbsolute(dbPath) ? dbPath : path.resolve(process.cwd(), dbPath);
    // Wait for database file to exist
    while (!fs.existsSync(absoluteDbPath)) {
        console.log(`[${new Date().toISOString()}] Waiting for database: ${absoluteDbPath}`);
        await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    const db = new SqliteAnnotationAdapter(absoluteDbPath);
    // Initialize known state
    await initializeState(db);
    // Remove old socket if exists
    if (fs.existsSync(SOCKET_PATH)) {
        fs.unlinkSync(SOCKET_PATH);
    }
    // Create Unix socket server
    const server = net.createServer((socket) => {
        console.log(`[${new Date().toISOString()}] Client connected`);
        clients.add(socket);
        // Send current state summary
        const summary = {
            type: 'connected',
            annotationCount: state.knownAnnotations.size,
            lastCheck: state.lastCheck.toISOString(),
        };
        socket.write(JSON.stringify(summary) + '\n');
        socket.on('close', () => {
            console.log(`[${new Date().toISOString()}] Client disconnected`);
            clients.delete(socket);
        });
        socket.on('error', (error) => {
            console.error('Socket error:', error);
            clients.delete(socket);
        });
    });
    server.listen(SOCKET_PATH, () => {
        console.log(`[${new Date().toISOString()}] Listening on ${SOCKET_PATH}`);
        // Make socket accessible
        fs.chmodSync(SOCKET_PATH, 0o777);
    });
    // Poll loop
    setInterval(async () => {
        const changes = await pollForChanges(db);
        broadcast(changes);
    }, POLL_INTERVAL);
    // Handle shutdown
    process.on('SIGINT', () => {
        console.log(`\n[${new Date().toISOString()}] Shutting down...`);
        server.close();
        db.close();
        if (fs.existsSync(SOCKET_PATH)) {
            fs.unlinkSync(SOCKET_PATH);
        }
        process.exit(0);
    });
    process.on('SIGTERM', () => {
        console.log(`[${new Date().toISOString()}] Received SIGTERM`);
        server.close();
        db.close();
        if (fs.existsSync(SOCKET_PATH)) {
            fs.unlinkSync(SOCKET_PATH);
        }
        process.exit(0);
    });
}
main().catch((error) => {
    console.error('Watcher error:', error);
    process.exit(1);
});
