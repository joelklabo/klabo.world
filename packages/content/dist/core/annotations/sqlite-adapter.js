// SQLite adapter for annotations using better-sqlite3
import Database from 'better-sqlite3';
function generateCuid() {
    // Simple cuid-like id generation
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `c${timestamp}${random}`;
}
export class SqliteAnnotationAdapter {
    db;
    constructor(databasePath) {
        this.db = new Database(databasePath);
    }
    rowToRecord(row) {
        return {
            id: row.id,
            draftSlug: row.draftSlug,
            type: row.type,
            status: row.status,
            content: row.content,
            selectors: row.selectors,
            color: row.color,
            pinNumber: row.pinNumber,
            parentId: row.parentId,
            depth: row.depth,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
            resolvedAt: row.resolvedAt ? new Date(row.resolvedAt) : null,
            authorId: row.authorId,
        };
    }
    async findMany(args) {
        const conditions = [];
        const params = [];
        if (args.where.draftSlug !== undefined) {
            conditions.push('draftSlug = ?');
            params.push(args.where.draftSlug);
        }
        if (args.where.status !== undefined) {
            conditions.push('status = ?');
            params.push(args.where.status);
        }
        if (args.where.parentId === null) {
            conditions.push('parentId IS NULL');
        }
        else if (args.where.parentId !== undefined) {
            conditions.push('parentId = ?');
            params.push(args.where.parentId);
        }
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const orderClause = args.orderBy?.createdAt
            ? `ORDER BY createdAt ${args.orderBy.createdAt.toUpperCase()}`
            : '';
        const sql = `SELECT * FROM Annotation ${whereClause} ${orderClause}`;
        const stmt = this.db.prepare(sql);
        const rows = stmt.all(...params);
        return rows.map((row) => this.rowToRecord(row));
    }
    async findUnique(args) {
        const stmt = this.db.prepare('SELECT * FROM Annotation WHERE id = ?');
        const row = stmt.get(args.where.id);
        if (!row) {
            return null;
        }
        const record = this.rowToRecord(row);
        if (args.include?.replies) {
            const repliesStmt = this.db.prepare('SELECT * FROM Annotation WHERE parentId = ? ORDER BY createdAt ASC');
            const replyRows = repliesStmt.all(args.where.id);
            return {
                ...record,
                replies: replyRows.map((r) => this.rowToRecord(r)),
            };
        }
        return record;
    }
    async create(args) {
        const id = args.data.id ?? generateCuid();
        const now = new Date().toISOString();
        const sql = `
      INSERT INTO Annotation (
        id, draftSlug, type, status, content, selectors, color,
        pinNumber, parentId, depth, createdAt, updatedAt, resolvedAt, authorId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
        const stmt = this.db.prepare(sql);
        stmt.run(id, args.data.draftSlug, args.data.type, args.data.status ?? 'OPEN', args.data.content, args.data.selectors, args.data.color ?? '#3b82f6', args.data.pinNumber ?? null, args.data.parentId ?? null, args.data.depth ?? 0, now, now, args.data.resolvedAt?.toISOString() ?? null, args.data.authorId ?? null);
        return {
            id,
            draftSlug: args.data.draftSlug,
            type: args.data.type,
            status: args.data.status ?? 'OPEN',
            content: args.data.content,
            selectors: args.data.selectors,
            color: args.data.color ?? '#3b82f6',
            pinNumber: args.data.pinNumber ?? null,
            parentId: args.data.parentId ?? null,
            depth: args.data.depth ?? 0,
            createdAt: new Date(now),
            updatedAt: new Date(now),
            resolvedAt: args.data.resolvedAt ?? null,
            authorId: args.data.authorId ?? null,
        };
    }
    async update(args) {
        const updates = ['updatedAt = ?'];
        const params = [new Date().toISOString()];
        for (const [key, value] of Object.entries(args.data)) {
            if (value !== undefined) {
                updates.push(`${key} = ?`);
                if (value instanceof Date) {
                    params.push(value.toISOString());
                }
                else {
                    params.push(value);
                }
            }
        }
        params.push(args.where.id);
        const sql = `UPDATE Annotation SET ${updates.join(', ')} WHERE id = ?`;
        const stmt = this.db.prepare(sql);
        stmt.run(...params);
        const result = await this.findUnique({ where: { id: args.where.id } });
        if (!result) {
            throw new Error(`Annotation not found: ${args.where.id}`);
        }
        return result;
    }
    async updateMany(args) {
        const updates = ['updatedAt = ?'];
        const params = [new Date().toISOString()];
        for (const [key, value] of Object.entries(args.data)) {
            if (value !== undefined) {
                updates.push(`${key} = ?`);
                if (value instanceof Date) {
                    params.push(value.toISOString());
                }
                else {
                    params.push(value);
                }
            }
        }
        params.push(args.where.parentId);
        const sql = `UPDATE Annotation SET ${updates.join(', ')} WHERE parentId = ?`;
        const stmt = this.db.prepare(sql);
        const result = stmt.run(...params);
        return { count: Number(result.changes) };
    }
    async delete(args) {
        const record = await this.findUnique({ where: { id: args.where.id } });
        if (!record) {
            throw new Error(`Annotation not found: ${args.where.id}`);
        }
        const stmt = this.db.prepare('DELETE FROM Annotation WHERE id = ?');
        stmt.run(args.where.id);
        return record;
    }
    async deleteMany(args) {
        const stmt = this.db.prepare('DELETE FROM Annotation WHERE parentId = ?');
        const result = stmt.run(args.where.parentId);
        return { count: Number(result.changes) };
    }
    async count(args) {
        const conditions = ['draftSlug = ?'];
        const params = [args.where.draftSlug];
        if (args.where.status) {
            conditions.push('status = ?');
            params.push(args.where.status);
        }
        const sql = `SELECT COUNT(*) as count FROM Annotation WHERE ${conditions.join(' AND ')}`;
        const stmt = this.db.prepare(sql);
        const row = stmt.get(...params);
        return row.count;
    }
    async aggregate(args) {
        const stmt = this.db.prepare('SELECT MAX(pinNumber) as maxPin FROM Annotation WHERE draftSlug = ?');
        const row = stmt.get(args.where.draftSlug);
        return { _max: { pinNumber: row.maxPin } };
    }
    close() {
        this.db.close();
    }
}
// Factory function to create adapter from environment
export function createAnnotationAdapter(databaseUrl) {
    const url = databaseUrl ?? process.env.DATABASE_URL ?? 'file:./app/prisma/dev.db';
    // Parse file: URL to get path
    const path = url.replace(/^file:/, '');
    return new SqliteAnnotationAdapter(path);
}
