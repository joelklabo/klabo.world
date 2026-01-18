// Client library for connecting to the annotation watcher
import * as net from 'node:net';
import * as readline from 'node:readline';
const DEFAULT_SOCKET_PATH = '/tmp/klaboworld-annotations.sock';
export class AnnotationWatcherClient {
    socket = null;
    listeners = new Set();
    reconnectTimer = null;
    socketPath;
    constructor(socketPath = DEFAULT_SOCKET_PATH) {
        this.socketPath = socketPath;
    }
    connect() {
        return new Promise((resolve, reject) => {
            this.socket = net.createConnection(this.socketPath);
            const rl = readline.createInterface({
                input: this.socket,
                crlfDelay: Infinity,
            });
            rl.on('line', (line) => {
                try {
                    const message = JSON.parse(line);
                    this.handleMessage(message);
                }
                catch (error) {
                    console.error('Error parsing message:', error);
                }
            });
            this.socket.on('connect', () => {
                console.log('Connected to annotation watcher');
                resolve();
            });
            this.socket.on('error', (error) => {
                console.error('Watcher connection error:', error);
                reject(error);
            });
            this.socket.on('close', () => {
                console.log('Disconnected from annotation watcher');
                this.scheduleReconnect();
            });
        });
    }
    handleMessage(message) {
        if (message.type === 'connected') {
            console.log(`Watcher has ${message.annotationCount} annotations, last check: ${message.lastCheck}`);
        }
        else if (message.type === 'annotations' && message.changes) {
            for (const listener of this.listeners) {
                listener(message.changes);
            }
        }
    }
    scheduleReconnect() {
        if (this.reconnectTimer)
            return;
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            console.log('Attempting to reconnect...');
            this.connect().catch(() => {
                // Will trigger another reconnect
            });
        }, 5000);
    }
    onChanges(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    disconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.socket) {
            this.socket.destroy();
            this.socket = null;
        }
    }
}
// CLI script for testing
if (import.meta.url === `file://${process.argv[1]}`) {
    const client = new AnnotationWatcherClient();
    client.onChanges((changes) => {
        for (const change of changes) {
            console.log(`[${change.type}] ${change.annotationId} on ${change.draftSlug}`);
        }
    });
    client.connect().catch((error) => {
        console.error('Failed to connect:', error);
        process.exit(1);
    });
}
