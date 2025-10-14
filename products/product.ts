import { api } from "encore.dev/api";
import { productsDb } from "./db";

interface Product {
    id: number;
    name: string;
    stock: number;
    created_at: Date;
}
interface Response {
    product?: Product;
    message?: string;
}

//endpoint para obtener todos los productos
export const list = api(
    { expose: true, method: "GET", path: "/products" },
    async (): Promise<{ products: Product[] }> => {
        const products: Product[] = [];
        for await (const row of productsDb.query`
            SELECT *
            FROM products
            ORDER BY created_at DESC
            `) {
            products.push(row as Product);
        }
        return {products}
    }
)
export const get = api(
    { expose: true, method: "GET", path: "/products/:id" },
    async ({ id }: { id: number }): Promise<Response> => {
        const rows: Product[] = [];
        
        for await (const row of productsDb.query`
            SELECT id, name, stock, created_at 
            FROM products 
            WHERE id = ${id}
            LIMIT 1
        `) {
            rows.push(row as Product);
        }

        if (rows.length === 0) {
            return { message: "Producto no encontrado" };
        }

        return { product: rows[0] };
    }
);
// Endpoint para crear producto
export const create = api(
    { expose: true, method: "POST", path: "/products" },
    async ({ name, stock }: { name: string, stock:number }): Promise<Response> => {
        try {
            const rows: Product[] = [];
            
            for await (const row of productsDb.query`
                INSERT INTO products (name, stock)
                VALUES (${name}, ${stock})
                RETURNING id, name, stock, created_at
            `) {
                rows.push(row as Product);
            }

            return { product: rows[0], message: "Producto creado correctamente" };
        } catch (error) {
            return { message: "Error al crear producto." };
        }
    }
);
//Endpoint para eliminar producto 
export const remove = api(
    { expose: true, method: "DELETE", path: "/products/:id" },
    async ({ id }: { id: number }): Promise<Response> => {
        const rows: Product[] = [];
        
        for await (const row of productsDb.query`
            DELETE FROM products 
            WHERE id = ${id}
            RETURNING id, name, stock, created_at
        `) {
            rows.push(row as Product);
        }

        if (rows.length === 0) {
            return { message: "Producto no encontrado" };
        }

        return { 
            product: rows[0],
            message: "Producto eliminado exitosamente" 
        };
    }
);
// Endpoint para actualizar un usuario
export const update = api(
    { expose: true, method: "PUT", path: "/products/:id" },
    async ({ id, name, stock }: { id: number; name?: string; stock?: number }): Promise<Response> => {
        try {
            // Construir la query dinámicamente según los campos proporcionados
            const updates: string[] = [];
            const values: any[] = [];
            
            if (name !== undefined) {
                updates.push(`name = $${values.length + 1}`);
                values.push(name);
            }
            
            if (stock !== undefined) {
                updates.push(`stock = $${values.length + 1}`);
                values.push(stock);
            }
            
            if (updates.length === 0) {
                return { message: "No se proporcionaron campos para actualizar" };
            }
            
            const rows: Product[] = [];
            
            // Nota: Encore no soporta queries dinámicas fácilmente, así que hacemos un approach más simple
            if (stock && name) {
                for await (const row of productsDb.query`
                    UPDATE products 
                    SET stock = ${stock}, name = ${name}
                    WHERE id = ${id}
                    RETURNING id, stock, name, created_at
                `) {
                    rows.push(row as Product);
                }
            } else if (stock) {
                for await (const row of productsDb.query`
                    UPDATE products 
                    SET stock = ${stock}
                    WHERE id = ${id}
                    RETURNING id, stock, name, created_at
                `) {
                    rows.push(row as Product);
                }
            } else if (name) {
                for await (const row of productsDb.query`
                    UPDATE products 
                    SET name = ${name}
                    WHERE id = ${id}
                    RETURNING id, email, name, created_at
                `) {
                    rows.push(row as Product);
                }
            }

            if (rows.length === 0) {
                return { message: "Producto no encontrado" };
            }

            return { product: rows[0], message:"Producto actualizado correctamente" };
        } catch (error) {
            return { message: "Error al actualizar producto." };
        }
    }
);