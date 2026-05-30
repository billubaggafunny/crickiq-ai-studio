import { getPersistenceOwnerId } from './persistenceContext';

export const isValidOwnerId = (ownerId: unknown): boolean => {
    if (ownerId === undefined) return true; // Legacy/offline guest data
    if (typeof ownerId !== 'string') return false;
    if (ownerId.trim() === '') return false;
    return true;
};

export const sanitizeOwnerId = (ownerId: unknown): string | undefined => {
    if (isValidOwnerId(ownerId) && typeof ownerId === 'string') {
        return ownerId.trim();
    }
    return undefined;
};

export const doesOwnerMatchCurrentSession = (entityOwnerId: unknown): boolean => {
    if (!isValidOwnerId(entityOwnerId)) {
        return false;
    }
    
    // Legacy offline data without ownerId is safely visible
    if (entityOwnerId === undefined) {
        return true;
    }

    const currentOwnerId = getPersistenceOwnerId();
    return entityOwnerId === currentOwnerId;
};

export const enforceSessionOwner = <T extends { ownerId?: string }>(entity: T): T => {
    const currentOwnerId = getPersistenceOwnerId();
    // Validate current ownerId if present - drop strings that are empty/whitespace
    let currentEntityOwnerId: string | undefined = undefined;
    if (typeof entity.ownerId === 'string' && entity.ownerId.trim() !== '') {
        currentEntityOwnerId = entity.ownerId.trim();
    }

    if (currentOwnerId) {
        // Enforce the active session ownerId
        return { ...entity, ownerId: currentOwnerId };
    } else {
        // Not logged in. Remove malformed ownerIds, keep valid ones (they shouldn't exist ideally, but keep them if they do)
        return { ...entity, ownerId: currentEntityOwnerId };
    }
};
