import { SQLDatabase } from "encore.dev/storage/sqldb";

export const productsDb = new SQLDatabase("products",{
    migrations:"./migrations",
});