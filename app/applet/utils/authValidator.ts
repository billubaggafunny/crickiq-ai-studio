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
