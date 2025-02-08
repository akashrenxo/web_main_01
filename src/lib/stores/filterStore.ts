import { writable } from 'svelte/store';

interface FilterValue {
    [field: string]: string[];
}

interface FilterValues {
    [entityType: string]: FilterValue;
}

interface FilterState {
    values: FilterValues;
    visible: boolean;
}

interface FilterStateForAttributes {
    values: FilterValue;
    visible: boolean;
}

export const filterStore = writable<FilterState>({
    values: {},
    visible: false
});

export const filterStoreForAttributes = writable<FilterStateForAttributes>({
    values: {},
    visible: false
});


export const filterActions = {
    addFilter: (entityType: string, field: string, value: string) => {
        filterStore.update(state => {
            const entityFilters = state.values[entityType] || {};
            const fieldValues = entityFilters[field] || [];

            if (!fieldValues.includes(value)) {
                const updatedValues = {
                    ...state.values,
                    [entityType]: {
                        ...entityFilters,
                        [field]: [...fieldValues, value]
                    }
                };

                saveFiltersToStorage(updatedValues);

                return {
                    values: updatedValues,
                    visible: true
                };
            }
            return state;
        });
    },

    removeFilter: (entityType: string, field: string, value: string, fetchEntities: any) => {
        filterStore.update(state => {
            if (!state.values[entityType] || !state.values[entityType][field]) {
                return state;
            }

            const updatedEntityFilters = { ...state.values[entityType] };
            updatedEntityFilters[field] = updatedEntityFilters[field].filter(v => v !== value);

            if (updatedEntityFilters[field].length === 0) {
                delete updatedEntityFilters[field];
            }

            const updatedValues = { ...state.values };

            if (Object.keys(updatedEntityFilters).length === 0) {
                delete updatedValues[entityType];
            } else {
                updatedValues[entityType] = updatedEntityFilters;
            }

            const hasFilters = Object.values(updatedValues).some(entityFilters =>
                Object.values(entityFilters).some(arr => arr.length > 0)
            );

            saveFiltersToStorage(updatedValues);
            let localFilterByValues =
                localStorage.getItem("filterByValues");

            let parseData = (localFilterByValues && localFilterByValues != "{}")
                ? JSON.parse(localFilterByValues)[entityType]
                : {};
            fetchEntities(5, 0, "", [], "", "", parseData);
            return {
                values: updatedValues,
                visible: hasFilters
            };
        });
    },

    clearEntityFilters: (entityType: string) => {
        filterStore.update(state => {
            const updatedValues = { ...state.values };
            delete updatedValues[entityType];

            const hasFilters = Object.values(updatedValues).some(entityFilters =>
                Object.values(entityFilters).some(arr => arr.length > 0)
            );

            saveFiltersToStorage(updatedValues);

            return {
                values: updatedValues,
                visible: hasFilters
            };
        });
    },

    clearAllFilters: () => {
        filterStore.set({
            values: {},
            visible: false
        });
        localStorage.removeItem('filterByValues');
    }
};

export const filterActionsForAttibutes = {
    removeFilter: (entityName: string, value: string, columnOrder: any, $attributes: any, fetchEntities: any) => {
        filterStoreForAttributes.update((state) => {
            if (!state.values[entityName] || state.values[entityName].length === 0) {
                return state;
            }

            const updatedEntityFilters = state.values[entityName].filter(v => v !== value);
            const updatedValues = { ...state.values };

            if (updatedEntityFilters.length === 0) {
                delete updatedValues[entityName];
                console.log("attributes001", $attributes);
                columnOrder.set($attributes.map((attr: any) => attr.name));
                let localFilterByValues = localStorage.getItem("filterByValues");

                let parseData =
                    localFilterByValues &&
                        localFilterByValues != "{}" &&
                        JSON.parse(localFilterByValues)[entityName] != undefined
                        ? JSON.parse(localFilterByValues)[entityName]
                        : {};
                fetchEntities(5, 0, "", [], "", "", parseData);
            } else {
                updatedValues[entityName] = updatedEntityFilters;
                columnOrder.set(updatedEntityFilters);
            }

            const hasFilters = Object.values(updatedValues).some(filters => filters.length > 0);
            saveFiltersToStorageForAttributes(updatedValues);

            return {
                values: updatedValues,
                visible: hasFilters
            };
        });
    },

    clearEntityFilters: (entityName: string, columnOrder: any, $attributes: any, fetchEntities: any) => {
        filterStoreForAttributes.update(state => {
            const updatedValues = { ...state.values };
            delete updatedValues[entityName];

            const hasFilters = Object.values(updatedValues).some(filters => filters.length > 0);

            saveFiltersToStorageForAttributes(updatedValues);
            columnOrder.set($attributes.map((attr: any) => attr.name));
            let localFilterByValues =
                localStorage.getItem("filterByValues");

            let parseData = localFilterByValues && localFilterByValues != "{}" && (JSON.parse(localFilterByValues))[entityName] != undefined
                ? JSON.parse(localFilterByValues)[entityName]
                : {};
            fetchEntities(5, 0, "", [], "", "", parseData);
            return {
                values: updatedValues,
                visible: hasFilters
            };
        });
    },
}

export const formatLabel = (key: string): string => {
    return key
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const saveFiltersToStorage = (filters: FilterValues): void => {
    localStorage.setItem('filterByValues', JSON.stringify(filters));
};

const saveFiltersToStorageForAttributes = (filters: FilterValue): void => {
    localStorage.setItem('filterByAttributes', JSON.stringify(filters));
};

export const loadFiltersFromStorage = (): void => {
    try {
        const storedFilters = localStorage.getItem('filterByValues');
        if (storedFilters) {
            const parsedFilters = storedFilters ? JSON.parse(storedFilters) : {};
            const hasFilters = Object.values(parsedFilters).some(
                (entityFilters: any) => Object.values(entityFilters).some(
                    (values: any) => values.length > 0
                )
            );
            filterStore.set({
                values: parsedFilters,
                visible: hasFilters
            });
        }
    } catch (error) {
        console.error('Error loading filters from storage:', error);
        filterStore.set({
            values: {},
            visible: false
        });
    }
};

export const loadFiltersFromStorageForAttributes = (): void => {
    try {
        const storedFilters = localStorage.getItem('filterByAttributes');
        if (storedFilters) {
            const parsedFilters = storedFilters ? JSON.parse(storedFilters) : {};
            const hasFilters = Object.values(parsedFilters).some(
                (entityFilters: any) => Object.values(entityFilters).some(
                    (values: any) => values.length > 0
                )
            );
            filterStoreForAttributes.set({
                values: parsedFilters,
                visible: hasFilters
            });
        }
    } catch (error) {
        console.error('Error loading filters from storage:', error);
        filterStore.set({
            values: {},
            visible: false
        });
    }
};