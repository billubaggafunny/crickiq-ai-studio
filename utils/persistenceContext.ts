let currentPersistenceOwnerId: string | undefined = undefined;

export const setPersistenceOwnerId = (id: string | undefined) => {
    currentPersistenceOwnerId = id;
};

export const getPersistenceOwnerId = () => currentPersistenceOwnerId;

export const isEntityOwnedByCurrent = (entityOwnerId: string | undefined): boolean => {
    // Entities without an ownerId are legacy offline data.
    // They remain temporarily visible for backward compatibility until auth migration happens.
    if (entityOwnerId === undefined) {
        return true;
    }
    
    // Auth-scoped entities must strictly match the current active user
    return entityOwnerId === currentPersistenceOwnerId;
};
