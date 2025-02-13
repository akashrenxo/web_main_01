import { writable, type Writable, derived } from "svelte/store";
import { websocketStore } from "../websocket";
import Cookies from "js-cookie";
import { addToast } from "$lib/stores/toastStore";
import errorMessage from "../../../../src/messages/errorMessages.json";
import successMessage from "../../../../src/messages/successMessages.json";
import warningMessage from "../../../../src/messages/warningMessages.json";


export interface Entity {
    id: string;
    [key: string]: any;
}

export interface MessageModal {
    status: string;
    message: string;
}


const userId = Cookies.get("userId") || "";

export function entityStore<T extends Entity>(entityName: string) {
    const entitiesData: Writable<T[]> = writable([]);
    const attributes: Writable<T[]> = writable([]);
    const isConnected: Writable<boolean> = writable(false);
    const messageModal: Writable<MessageModal | null> = writable(null);
    const offset: Writable<number> = writable(0);
    const totalrecords: Writable<number> = writable(0);
    const totalfetched: Writable<number> = writable(0);
    const nextoffset: Writable<number> = writable(0);
    const hasmore: Writable<boolean> = writable(true);
    const requestid: Writable<string> = writable("");
    const successcode: Writable<string> = writable("");

    const fetchEntityAttributes = () => {
        console.log(`Fetching ${entityName}'s attributes...`);
        const message = {
            type: "action",
            action: "GetEntity",
            env: { user: userId },
            params: {
                entityName: "entity",
                primaryKey: entityName
            }
        };
        websocketStore.sendMessage(message);
    };

    const fetchEntities = (limit: number, nextoffset: number, requestid: string, filterAttributes: string[], sortBy: string, sortOrder: string, filterValues: any) => {
        console.log(`Fetching ${entityName}s...`);
        entitiesData.set([]);

        const formattedFilters = Object.fromEntries(
            Object.entries(filterValues).map(([key, value]: any) => {

                const transformedValue = value.length === 1 ? value[0] : value;
                const processValue = (val: string | string[]) => {
                    if (Array.isArray(val)) {
                        return val.map(item => item.toLowerCase() === "yes" ? true : item.toLowerCase() === "no" ? false : item);
                    }
                    return val.toLowerCase() === "yes" ? true : val.toLowerCase() === "no" ? false : val;
                };

                return [key, processValue(transformedValue)];

            })
        );

        console.log("hiiii", formattedFilters);
        const baseParams = {
            entityName,
            limit: limit,
            offset: nextoffset || 0,
            requestID: requestid,
            sortBy,
            sortOrder,
            ...formattedFilters
        };

        const params = filterAttributes.length > 0
            ? { ...baseParams, filter: filterAttributes }
            : baseParams;

        const message = {
            type: "action",
            action: "ListEntity",
            env: { user: userId },
            params
        };

        console.log("message__fetchentities", message);
        websocketStore.sendMessage(message);
    };

    const addEntity = (entityData: Omit<T, "id">) => {
        const sendData = {
            data: entityData
        }
        const message = {
            type: "action",
            action: "AddEntity",
            env: { user: userId },
            params: { entityName },
            payload: JSON.stringify(sendData)
        };
        websocketStore.sendMessage(message);
    };

    const updateEntity = (primarykeyname: string, primaryKey: string, updatedData: Partial<T>) => {
        const message = {
            type: "action",
            action: "UpdateEntity",
            env: { user: userId },
            params: {
                entityName,
                [primarykeyname]: primaryKey,
                updates: updatedData
            }
        };
        console.log("message", message);
        websocketStore.sendMessage(message);
    };

    const deleteEntity = (id: string) => {
        const message = {
            type: "action",
            action: "RemoveEntity",
            env: { user: userId },
            params: {
                entityName,
                primaryKey: id
            }
        };
        websocketStore.sendMessage(message);
        console.log("delete_entity_msg", message);
    };

    const parseEntityData = (data: string): T[] => {
        try {
            const parsedData = JSON.parse(data);
            return parsedData;
        } catch (error) {
            console.error(`Error parsing ${entityName} data:`, error);
            return [];
        }
    };

    interface Translations {
        "en-US": string;
        "fr-FR": string;
    }

    type SupportedLanguages = keyof Translations;

    function getTranslation(
        successCode: keyof typeof successMessage,
        languageCode: SupportedLanguages,
        variables: Record<string, string> = {}
    ): string {
        const entry = successMessage[successCode];
        if (!entry) {
            console.error(`Invalid success code: ${successCode}`);
            return '';
        }

        const translations = entry.translations as Translations;
        const translation = translations[languageCode];

        if (!translation) {
            console.error(`Language code ${languageCode} not found for ${successCode}`);
            return translations["en-US"] || '';
        }

        try {
            return entry.variables.reduce((text: string, varName: string) => {
                const value = variables[varName];
                if (value === undefined) {
                    console.warn(`Missing variable: ${varName}, using empty string`);
                    return text.replace(`{${varName}}`, '');
                }
                return text.replace(`{${varName}}`, value);
            }, translation);
        } catch (error) {
            console.error('Error during translation:', error);
            return '';
        }
    }

    const handleRefresh = (successcode: any) => {

        const LocalEntityName = localStorage.getItem("selectedEntity");
        let entityName = LocalEntityName ? LocalEntityName.slice(0, -1) : "";

        const LocalEntityNextOffset = localStorage.getItem("entityNextOffset");
        let nextoffset = LocalEntityNextOffset && LocalEntityNextOffset != "{}" && (JSON.parse(LocalEntityNextOffset))[entityName] != undefined ? (JSON.parse(LocalEntityNextOffset))[entityName] : {};

        const localFilterByValue = localStorage.getItem("filterByValues");
        let filterbyvalue = localFilterByValue && localFilterByValue != "{}" && (JSON.parse(localFilterByValue))[entityName] != undefined ? JSON.parse(localFilterByValue)[entityName] : {};

        const localFilterByAttributes = localStorage.getItem("filterByAttributes");
        let filterbyattribute = localFilterByAttributes && localFilterByAttributes != "[]" && (JSON.parse(localFilterByAttributes))[entityName] != undefined ? JSON.parse(localFilterByAttributes)[entityName] : [];

        console.log("checking", nextoffset, filterbyvalue, filterbyattribute);

        fetchEntities(5, nextoffset, "", filterbyattribute, "", "", filterbyvalue);

        const lastToastTime: any = localStorage.getItem("lastToastTime");
        const now: any = Date.now();

        if (!lastToastTime || now - lastToastTime > 2000) {
            addToast(getTranslation(successcode, "en-US"), "success");
            localStorage.setItem("lastToastTime", now);
        }
    }

    const handleWebSocketMessage = (message: any) => {
        if (!message?.result?.code) return;

        const { action, result, params } = message;
        const successCode = result.code;
        if ((result.code).substring(0, 3) === "ERR") {
            entitiesData.set([]);
        }
        successcode.set(successCode);
        switch (action) {
            case "ListEntity":
                if (successCode === "SUCCESS200" && params?.result) {
                    entitiesData.set(parseEntityData(params?.result));
                    offset.set(params.offset);
                    requestid.set(params.requestID);
                    totalrecords.set(params.totalRecords);
                    hasmore.set(params.hasMore);
                    totalfetched.set(params.totalFetched);
                    nextoffset.set(params.nextOffset);
                    console.log("entitiesData", params.result);
                }
                break;
            case "GetEntity":
                if (successCode === "SUCCESS200" && params[entityName]) {
                    const entityData = JSON.parse(params[entityName]);
                    const attributesData = entityData.attributes || [];
                    attributes.set(attributesData);
                    console.log("attributes", attributesData);
                }
                break;
            case "UpdateEntity":
                if (successCode === "SUCCESS199") {
                    handleRefresh("SUCCESS199");
                }
                break;
            case "RemoveEntity":
                if (successCode === "SUCCESS220") {
                    handleRefresh("SUCCESS220");
                }
                break;
            case "AddEntity":
                if (successCode === "SUCCESS122") {
                    handleRefresh("SUCCESS122");
                }
                break;
        }
    };

    const processedMessages = new Set();

    websocketStore.subscribe(($websocketStore) => {
        isConnected.set($websocketStore.isConnected);

        if ($websocketStore.messages?.length) {
            const lastMessage = $websocketStore.messages[$websocketStore.messages.length - 1];
            if (lastMessage?.result?.code && !processedMessages.has(JSON.stringify(lastMessage))) {
                processedMessages.add(JSON.stringify(lastMessage));
                handleWebSocketMessage(lastMessage);
            }
        }

        if ($websocketStore.messageModal) {
            messageModal.set($websocketStore.messageModal);
        }
    });

    return {
        nextoffset,
        totalrecords,
        totalfetched,
        hasmore,
        offset,
        entitiesData,
        attributes,
        isConnected,
        requestid,
        messageModal,
        fetchEntities,
        addEntity,
        updateEntity,
        deleteEntity,
        fetchEntityAttributes
    };
}