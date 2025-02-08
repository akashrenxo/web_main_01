import { writable, get } from "svelte/store";
import { websocketStore } from "../websocket";
import Cookies from "js-cookie";

export interface MenuItem {
    id: string;
    menu: string;
    submenu?: MenuItem[];
}

const CACHE_DURATION = 24 * 60 * 60 * 1000;
const REFRESH_THRESHOLD = 23 * 60 * 60 * 1000;
const FORCE_UPDATE_INTERVAL = REFRESH_THRESHOLD;

export const menuItems = writable<MenuItem[]>([]);
export const isConnected = writable(false);
export const messageModal = writable<{ status: string; message: string } | null>(null);
export const isRefreshing = writable(false);
export const lastUpdateTime = writable<number>(0);

const userId = Cookies.get("userId") || "";
let lastActivityTime = Date.now();

const resetActivityTimer = () => {
    lastActivityTime = Date.now();
};

if (typeof window !== 'undefined') {
    window.addEventListener('mousemove', resetActivityTimer);
    window.addEventListener('keydown', resetActivityTimer);
}

const saveMenuToLocalStorage = (items: MenuItem[]) => {
    try {
        const saveData = {
            items,
            timestamp: Date.now(),
            version: Date.now()
        };
        localStorage.setItem('webapp_menu_items', JSON.stringify(saveData));
    } catch (error) {
        console.error("Error saving menu to localStorage:", error);
    }
};

const getMenuFromLocalStorage = (): {
    items: MenuItem[] | null;
    needsRefresh: boolean;
    version?: number;
} => {
    try {
        const stored = localStorage.getItem('webapp_menu_items');
        if (!stored) {
            return { items: null, needsRefresh: true };
        }
        const { items, timestamp, version } = JSON.parse(stored);
        const now = Date.now();
        const age = now - timestamp;
        const inactivity = now - lastActivityTime;
        if (inactivity > CACHE_DURATION || age > CACHE_DURATION) {
            return { items: null, needsRefresh: true };
        }
        if (age > REFRESH_THRESHOLD) {
            return { items, needsRefresh: true, version };
        }
        return {
            items,
            needsRefresh: false,
            version
        };
    } catch (error) {
        console.error("Error reading menu from localStorage:", error);
        return { items: null, needsRefresh: true };
    }
};

let refreshCheckInterval: any = null;
const startRefreshCheck = () => {
    if (refreshCheckInterval) return;
    refreshCheckInterval = setInterval(() => {
        const { needsRefresh } = getMenuFromLocalStorage();
        if (needsRefresh && !get(isRefreshing)) {
            refreshMenuItems();
        }
    }, FORCE_UPDATE_INTERVAL);
};

const stopRefreshCheck = () => {
    if (refreshCheckInterval) {
        clearInterval(refreshCheckInterval);
        refreshCheckInterval = null;
    }
};

export const fetchMenuItems = (forceRefresh?: boolean) => {
    const { items, needsRefresh } = getMenuFromLocalStorage();
    startRefreshCheck();
    if (items && !forceRefresh) {
        console.log('✅ Loading menu items from localStorage cache');
        menuItems.set(items);
        if (!needsRefresh) {
            console.log('📦 Cache is valid, no refresh needed');
            return;
        }
        console.log('⚠️ Cache needs refresh');
    } else {
        console.log('🔄 No cache available or force refresh requested');
    }
    if (needsRefresh || forceRefresh) {
        refreshMenuItems();
    }
};

const hasUnsavedChanges = (): boolean => {
    // Implement logic to detect unsaved changes on the website
    // For now, return false as a placeholder
    return false;
};

export const refreshMenuItems = async () => {
    if (get(isRefreshing)) {
        return;
    }
    if (hasUnsavedChanges()) {
        console.log("⚠️ Unsaved changes detected. Deferring menu updates.");
        return;
    }
    isRefreshing.set(true);
    console.log('🔄 Fetching fresh menu data from server...');
    const message = {
        type: "action",
        action: "GetWebAppMenu",
        env: { user: userId },
        params: { entityName: "webapp_menu" },
    };
    try {
        websocketStore.sendMessage(message);
    } catch (error) {
        console.error("Error refreshing menu items:", error);
        isRefreshing.set(false);
    }
};

export const parseMenuData = (data: string): MenuItem[] => {
    try {
        const parsedData = JSON.parse(data);
        const processMenu = (menu: any): MenuItem => ({
            id: menu.id || "",
            menu: menu.menu || "Unknown",
            submenu: menu.submenu ? menu.submenu.map(processMenu) : undefined,
        });
        return parsedData.submenu ? parsedData.submenu.map(processMenu) : [];
    } catch (error) {
        console.error("Error parsing menu data:", error);
        return [];
    }
};

websocketStore.subscribe(($websocketStore) => {
    isConnected.set($websocketStore.isConnected);
    if ($websocketStore.messages?.length) {
        const lastMessage = $websocketStore.messages[$websocketStore.messages.length - 1];
        if (
            lastMessage?.action === "GetWebAppMenu" &&
            String(lastMessage?.result?.code) === "SUCCESS200" &&
            lastMessage?.params?.menu
        ) {
            const parsedMenuItems = parseMenuData(lastMessage.params.menu);
            const currentMenuItems = get(menuItems);
            const timeSinceLastUpdate = Date.now() - get(lastUpdateTime);
            if (
                !currentMenuItems.length ||
                JSON.stringify(currentMenuItems) !== JSON.stringify(parsedMenuItems) ||
                timeSinceLastUpdate > FORCE_UPDATE_INTERVAL
            ) {
                console.log('✨ Menu content changed, updating cache and UI');
                menuItems.set(parsedMenuItems);
                saveMenuToLocalStorage(parsedMenuItems);
                lastUpdateTime.set(Date.now());
            } else {
                console.log('🟰 Menu content unchanged, keeping current state');
            }
            console.log('✅ Menu refresh completed');
            isRefreshing.set(false);
            lastActivityTime = Date.now();
        }
    }
    if ($websocketStore.messageModal) {
        messageModal.set($websocketStore.messageModal);
        console.log("messageModal updated:", $websocketStore.messageModal);
    }
});

if (typeof window !== 'undefined') {
    window.addEventListener('unload', stopRefreshCheck);
}


// import { writable, get } from "svelte/store";
// import { websocketStore } from "../websocket";
// import Cookies from "js-cookie";

// export interface MenuItem {
//     id: string;
//     action?: string;
//     menu: string;
//     path?: string;
//     url?: string;
//     entity?: string;
//     submenu?: MenuItem[];
// }

// const CACHE_DURATION = 24 * 60 * 60 * 1000;
// const REFRESH_THRESHOLD = 23 * 60 * 60 * 1000;
// const FORCE_UPDATE_INTERVAL = REFRESH_THRESHOLD;

// const HARDCODED_MENU = {
//     id: "acf79aff-9bca-4c48-80b4-fdf2a0d2172a",
//     action: "webapp_main_menu",
//     menu: "Main Menu",
//     submenu: [
//         {
//             id: "c4418ac6-dd0e-44a6-8605-177f3c032563",
//             action: "web_main_menu_conf",
//             menu: "Config",
//             submenu: [
//                 { id: "d220a128-33bc-415f-86e7-a8b8c2e8a2e1", action: "web_conf_strg_rules", menu: "Storage Rules" },
//                 { id: "3d649564-976d-45d2-b9fe-08106a8a03f4", action: "web_conf_crcd", menu: "crocodile" },
//                 { id: "1f679728-145a-4a1e-9ecb-ddd5263335aa", action: "web_conf_ent_and_attr", menu: "Entities and Attributes" },
//                 { id: "1fe94870-f58f-4b2f-8a4c-28ca555e6ea8", action: "web_conf_enty_mntnce", menu: "Entity Maintenance" },
//                 { id: "91faf41a-6ff8-427e-96ee-46288e1557b7", action: "web_conf_replmnts", menu: "Replenishments" },
//                 { id: "bea025ab-65ec-4979-b4e6-28ce2d13a128", action: "web_conf_mntnce_scrn", menu: "Areas" },
//                 { id: "30aa5cad-4aa5-4415-b024-821a003ac2a2", action: "web_conf_roles", menu: "Roles" },
//                 { id: "9e30d0f6-783c-4cab-ad0e-fc1c92f3fb0f", action: "web_conf_invnt_flow", menu: "Inventory Flow" },
//                 { id: "93ac5903-6081-4324-9a6d-e0ac048cd3a1", action: "web_conf_perms", menu: "Permissions" },
//                 { id: "690a4c79-3ad5-4404-a3c1-90006fd2f233", action: "web_conf_invnt_attr", menu: "Inventory Attributes" },
//                 { id: "3906f9a0-f47f-4e7a-b637-dae89b2ad002", action: "web_conf_mixng_rules", menu: "Mixing Rules" }
//             ]
//         },
//         {
//             id: "bd9ab04e-d453-4709-ba2d-ebff44821db4", action: "web_main_menu_ibd", menu: "Inbound", submenu: [
//                 { id: "976f28cb-a257-4991-8756-d3722dbf2d75", action: "web_ibd_chk_in_trlr", menu: "CheckIn Trailer" },
//                 { id: "0a8e547d-ed27-4ff3-b141-bd85fcd12bb9", action: "web_ibd_apptmnt", menu: "Appointments" },
//                 { id: "386a10ed-a1dd-43f5-bd72-11fdd08c035c", action: "web_ibd_dock_schd", menu: "Dock Scheduling" },
//                 { id: "1e3d6a27-c140-41dc-9aba-0c40391ce1ae", action: "web_ibd_open_shpmnt_dtl", menu: "Open Shipment Details" },
//                 { id: "453007c4-dbcf-46f0-b1df-e69f72fdfe4f", action: "web_ibd_inb_ord", menu: "Inbound Order" },
//                 { id: "ee44b7c3-1d16-4b0f-bfc7-2232665ef00b", action: "web_ibd_inb_deliv", menu: "Inbound Deliveries" },
//                 { id: "6503e768-cb2e-4a89-8ece-5cd66ec90f71", action: "web_ibd_unld_trlr", menu: "Unload Trailer" }
//             ]
//         },
//         {
//             id: "8d55d133-ea6c-43d1-8df4-1fef1704f8f0", action: "web_main_menu_invnt", menu: "Inventory", submenu: [
//                 { id: "0c286581-5eff-478f-ac18-42065782b7e7", action: "web_invnt_invnt_work", menu: "Inventory Work" },
//                 { id: "49f333c8-9f29-478f-8ce2-1c5caded4bcb", action: "web_invnt_work_ord", menu: "Work Orders" },
//                 { id: "1494569d-597b-48df-b523-11c4029ff476", action: "web_invnt_counts", menu: "Counts" }
//             ]
//         },
//         {
//             id: "f5b0245a-0f52-4b92-b1ad-87c6f1aa4b69", action: "web_main_menu_mstr_data", menu: "Master Data", submenu: [
//                 { "entity": "supplier", id: "719defbd-c7fd-475a-89c4-b2e6301e2cd8", action: "web_mstr_data_mntnce_scrn", menu: "Suppliers" },
//                 { "entity": "customer", id: "29ec24b9-69f1-4904-b8d1-1765ba83bd78", action: "web_mstr_data_mntnce_scrn", menu: "Customers" },
//                 { "entity": "product", id: "490a1e2e-ec25-4015-9f6a-2a052d063fd6", action: "web_mstr_data_mntnce_scrn", menu: "Products" },
//                 { "entity": "location", id: "e8aa54ff-2695-4ba6-aab6-d6c77f53d796", action: "web_mstr_data_mntnce_scrn", menu: "Locations" }
//             ]
//         },
//         {
//             id: "a1ff7b56-a4f1-4d4d-b13b-858f2037c746", action: "web_main_menu_oprn", menu: "Operations", submenu: [
//                 { id: "3ca8d151-9fcc-497f-9042-b559ad226d99", action: "web_oprn_ext_url", menu: "External Screen", "url": "192.168.31.169:8080" },
//                 { id: "c57ab7c7-d9db-4c7f-b9a3-b5ba84d3c9f1", action: "web_oprn_tasks", menu: "Tasks" }
//             ]
//         },
//         { id: "89c1887b-0acb-4374-9211-ce0f040bd584", action: "web_main_menu_obd", menu: "Outbound" }
//     ]
// };

// export const menuItems = writable<MenuItem[]>([]);
// export const isConnected = writable(false);
// export const messageModal = writable<{ status: string; message: string } | null>(null);
// export const isRefreshing = writable(false);
// export const lastUpdateTime = writable<number>(0);

// const userId = Cookies.get("userId") || "";
// let lastActivityTime = Date.now();

// const resetActivityTimer = () => {
//     lastActivityTime = Date.now();
// };

// if (typeof window !== 'undefined') {
//     window.addEventListener('mousemove', resetActivityTimer);
//     window.addEventListener('keydown', resetActivityTimer);
// }

// const saveMenuToLocalStorage = (items: MenuItem[]) => {
//     try {
//         const saveData = {
//             items,
//             timestamp: Date.now(),
//             version: Date.now()
//         };
//         localStorage.setItem('webapp_menu_items', JSON.stringify(saveData));
//     } catch (error) {
//         console.error("Error saving menu to localStorage:", error);
//     }
// };

// const getMenuFromLocalStorage = (): {
//     items: MenuItem[] | null;
//     needsRefresh: boolean;
//     version?: number;
// } => {
//     try {
//         const stored = localStorage.getItem('webapp_menu_items');
//         if (!stored) {
//             return { items: null, needsRefresh: true };
//         }
//         const { items, timestamp, version } = JSON.parse(stored);
//         const now = Date.now();
//         const age = now - timestamp;
//         const inactivity = now - lastActivityTime;
//         if (inactivity > CACHE_DURATION || age > CACHE_DURATION) {
//             return { items: null, needsRefresh: true };
//         }
//         if (age > REFRESH_THRESHOLD) {
//             return { items, needsRefresh: true, version };
//         }
//         return {
//             items,
//             needsRefresh: false,
//             version
//         };
//     } catch (error) {
//         console.error("Error reading menu from localStorage:", error);
//         return { items: null, needsRefresh: true };
//     }
// };

// let refreshCheckInterval: any = null;
// const startRefreshCheck = () => {
//     if (refreshCheckInterval) return;
//     refreshCheckInterval = setInterval(() => {
//         const { needsRefresh } = getMenuFromLocalStorage();
//         if (needsRefresh && !get(isRefreshing)) {
//             refreshMenuItems();
//         }
//     }, FORCE_UPDATE_INTERVAL);
// };

// const stopRefreshCheck = () => {
//     if (refreshCheckInterval) {
//         clearInterval(refreshCheckInterval);
//         refreshCheckInterval = null;
//     }
// };

// export const fetchMenuItems = (forceRefresh?: boolean) => {
//     const { items, needsRefresh } = getMenuFromLocalStorage();
//     startRefreshCheck();
//     if (items && !forceRefresh) {
//         console.log("✅ Loading menu items from localStorage cache");
//         console.log("items :", items);
//         menuItems.set(items);
//         if (!needsRefresh) {
//             console.log('📦 Cache is valid, no refresh needed');
//             return;
//         }
//         console.log('⚠️ Cache needs refresh');

//     } else {
//         console.log('🔄 Using hardcoded menu data');
//         menuItems.set(HARDCODED_MENU.submenu || []);
//         saveMenuToLocalStorage(HARDCODED_MENU.submenu || []);
//         console.log("menu Items :", menuItems);
//         lastUpdateTime.set(Date.now());
//     }
// };

// const hasUnsavedChanges = (): boolean => {
//     return false;
// };

// export const refreshMenuItems = async () => {
//     if (get(isRefreshing)) {
//         return;
//     }
//     if (hasUnsavedChanges()) {
//         console.log("⚠️ Unsaved changes detected. Deferring menu updates.");
//         return;
//     }
//     isRefreshing.set(true);
//     console.log('🔄 Refreshing menu data...');

//     try {
//         menuItems.set(HARDCODED_MENU.submenu || []);
//         saveMenuToLocalStorage(HARDCODED_MENU.submenu || []);
//         lastUpdateTime.set(Date.now());
//         console.log('✅ Menu refresh completed');
//     } catch (error) {
//         console.error("Error refreshing menu items:", error);
//     } finally {
//         isRefreshing.set(false);
//     }
// };

// websocketStore.subscribe(($websocketStore) => {
//     isConnected.set($websocketStore.isConnected);
//     if ($websocketStore.messageModal) {
//         messageModal.set($websocketStore.messageModal);
//         console.log("messageModal updated:", $websocketStore.messageModal);
//     }
// });

// if (typeof window !== 'undefined') {
//     window.addEventListener('unload', stopRefreshCheck);
// }