import { api } from "encore.dev/api";
import { db } from "./db";

// Interface para el usuario
interface User {
    id: number;
    email: string;
    name: string;
    created_at: Date;
}

interface Response {
    user?: User;
    message?: string;
}

export const get = api(
    { expose: true, method: "GET", path: "/users/:id" },
    async ({ id }: { id: number }): Promise<Response> => {
        const rows: User[] = [];
        
        for await (const row of db.query`
            SELECT id, email, name, created_at 
            FROM users 
            WHERE id = ${id}
            LIMIT 1
        `) {
            rows.push(row as User);
        }

        if (rows.length === 0) {
            return { message: "Usuario no encontrado" };
        }

        return { user: rows[0] };
    }
);

// Endpoint para obtener todos los usuarios
export const list = api(
    { expose: true, method: "GET", path: "/users" },
    async (): Promise<{ users: User[] }> => {
        const users: User[] = [];
        
        for await (const row of db.query`
            SELECT id, email, name, created_at 
            FROM users 
            ORDER BY created_at DESC
        `) {
            users.push(row as User);
        }

        return { users };
    }
);

// Endpoint para crear un usuario
export const create = api(
    { expose: true, method: "POST", path: "/users" },
    async ({ email, name }: { email: string; name: string }): Promise<Response> => {
        try {
            const rows: User[] = [];
            
            for await (const row of db.query`
                INSERT INTO users (email, name)
                VALUES (${email}, ${name})
                RETURNING id, email, name, created_at
            `) {
                rows.push(row as User);
            }

            return { user: rows[0] };
        } catch (error) {
            return { message: "Error al crear usuario. El email podría estar duplicado." };
        }
    }
);
// Endpoint para actualizar un usuario
export const update = api(
    { expose: true, method: "PUT", path: "/users/:id" },
    async ({ id, email, name }: { id: number; email?: string; name?: string }): Promise<Response> => {
        try {
            // Construir la query dinámicamente según los campos proporcionados
            const updates: string[] = [];
            const values: any[] = [];
            
            if (email !== undefined) {
                updates.push(`email = $${values.length + 1}`);
                values.push(email);
            }
            
            if (name !== undefined) {
                updates.push(`name = $${values.length + 1}`);
                values.push(name);
            }
            
            if (updates.length === 0) {
                return { message: "No se proporcionaron campos para actualizar" };
            }
            
            const rows: User[] = [];
            
            // Nota: Encore no soporta queries dinámicas fácilmente, así que hacemos un approach más simple
            if (email && name) {
                for await (const row of db.query`
                    UPDATE users 
                    SET email = ${email}, name = ${name}
                    WHERE id = ${id}
                    RETURNING id, email, name, created_at
                `) {
                    rows.push(row as User);
                }
            } else if (email) {
                for await (const row of db.query`
                    UPDATE users 
                    SET email = ${email}
                    WHERE id = ${id}
                    RETURNING id, email, name, created_at
                `) {
                    rows.push(row as User);
                }
            } else if (name) {
                for await (const row of db.query`
                    UPDATE users 
                    SET name = ${name}
                    WHERE id = ${id}
                    RETURNING id, email, name, created_at
                `) {
                    rows.push(row as User);
                }
            }

            if (rows.length === 0) {
                return { message: "Usuario no encontrado" };
            }

            return { user: rows[0] };
        } catch (error) {
            return { message: "Error al actualizar usuario. El email podría estar duplicado." };
        }
    }
);

// Endpoint para eliminar un usuario
export const remove = api(
    { expose: true, method: "DELETE", path: "/users/:id" },
    async ({ id }: { id: number }): Promise<Response> => {
        const rows: User[] = [];
        
        for await (const row of db.query`
            DELETE FROM users 
            WHERE id = ${id}
            RETURNING id, email, name, created_at
        `) {
            rows.push(row as User);
        }

        if (rows.length === 0) {
            return { message: "Usuario no encontrado" };
        }

        return { 
            user: rows[0],
            message: "Usuario eliminado exitosamente" 
        };
    }
);