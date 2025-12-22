/**
 * @file src/services/fichasTecnicasService.ts
 * @description CRUD service for Fichas Técnicas with versioning support.
 */

import { v4 as uuidv4 } from 'uuid';
import { firestoreService } from './firestoreService';
import { COLLECTIONS, collections } from '../firebase/collections';
import { calcularCostosFicha } from './costosService';
import type {
    FichaTecnica,
    CreateFichaDTO,
    UpdateFichaDTO,
    VersionFicha
} from '../types';
import { where, orderBy } from 'firebase/firestore';

/**
 * Creates a new Ficha Técnica.
 */
export async function crearFichaTecnica(
    data: CreateFichaDTO,
    userId: string
): Promise<FichaTecnica> {
    // 1. Calculate costs automatically
    const costos = await calcularCostosFicha(data);

    const id = uuidv4();
    const now = new Date().toISOString();

    const ficha: FichaTecnica = {
        ...data as any,
        id,
        version: 1,
        activa: true,
        costos,
        creadoPor: userId,
        fechaCreacion: now,
        ultimaModificacion: now
    };

    // 2. Save to Firestore
    const generatedId = await firestoreService.create(
        collections.fichasTecnicas,
        ficha as any
    );

    return { ...ficha, id: generatedId };
}

/**
 * Gets the active version of a Ficha Técnica.
 */
export async function obtenerFichaTecnica(id: string): Promise<FichaTecnica | null> {
    const ficha = await firestoreService.getById<FichaTecnica>(COLLECTIONS.FICHAS_TECNICAS, id);
    return ficha || null;
}

/**
 * Updates a Ficha Técnica with versioning.
 */
export async function actualizarFichaTecnica(
    id: string,
    updates: UpdateFichaDTO,
    userId: string,
    crearVersion: boolean = true
): Promise<FichaTecnica> {
    const currentFicha = await obtenerFichaTecnica(id);
    if (!currentFicha) throw new Error('Ficha not found');

    const now = new Date().toISOString();

    // 1. If versioning is requested, save current as a snapshot
    if (crearVersion) {
        const versionId = uuidv4();
        const snapshot: VersionFicha = {
            id: versionId,
            fichaId: id,
            version: currentFicha.version,
            snapshot: currentFicha,
            fechaVersion: now,
            cambiosRealizados: updates.notas || 'Actualización de versión',
            versionadaPor: userId
        };
        await firestoreService.create(
            collections.versionesFichas,
            snapshot as any
        );
    }

    // 2. Prepare updated data
    const updatedData = {
        ...currentFicha,
        ...updates,
        version: crearVersion ? currentFicha.version + 1 : currentFicha.version,
        ultimaModificacion: now,
        modificadoPor: userId
    };

    // 3. Recalculate costs if ingredients or portions changed
    if (updates.ingredientes || updates.porciones !== undefined) {
        updatedData.costos = await calcularCostosFicha(updatedData);
    }

    // 4. Save updates
    await firestoreService.update(COLLECTIONS.FICHAS_TECNICAS, id, updatedData);

    return updatedData as FichaTecnica;
}

/**
 * Lists Fichas Técnicas for an outlet.
 */
export async function listarFichas(outletId: string): Promise<FichaTecnica[]> {
    return firestoreService.query<FichaTecnica>(
        collections.fichasTecnicas as any,
        where('outletId', '==', outletId),
        where('activa', '==', true),
        orderBy('nombre', 'asc')
    );
}

/**
 * Soft deletes a Ficha Técnica.
 */
export async function eliminarFichaTecnica(id: string): Promise<void> {
    await firestoreService.update(COLLECTIONS.FICHAS_TECNICAS, id, { activa: false } as any);
}

/**
 * Duplicates an existing Ficha Técnica.
 */
export async function duplicarFicha(
    id: string,
    nuevoNombre: string,
    userId: string
): Promise<FichaTecnica> {
    const original = await obtenerFichaTecnica(id);
    if (!original) throw new Error('Ficha not found');

    const { id: _, version: __, ...rest } = original;
    return crearFichaTecnica({
        ...rest,
        nombre: nuevoNombre,
        notas: `Duplicado de: ${original.nombre}`
    } as any, userId);
}
