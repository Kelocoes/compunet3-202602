import { Request } from 'express';

// interfaz req de express para agregar trazabilidad
export interface CustomRequest extends Request {
    correlationId?: string;
}
