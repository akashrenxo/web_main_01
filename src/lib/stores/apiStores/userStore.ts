import { writable, type Writable } from "svelte/store";
import { websocketStore } from "../websocket";
import Cookies from "js-cookie";
import { addToast } from "../toastStore";
import successMessage from "../../../../src/messages/successMessages.json";

export interface MessageModal {
    status: string;
    message: string;
}

const userId = Cookies.get("userId") || "";

export const userStore = (entityName: string) => {
    const listEntityData: Writable<any> = writable([]);
    const rolesData: Writable<any> = writable([]);
    const userAttributes: Writable<any> = writable([]);
    const isConnected: Writable<boolean> = writable(false);
    const messageModal: Writable<MessageModal | null> = writable(null);

    const handleToast = (message: string, status: "success" | "error" | "info" | "warning") => {
        const lastToastTime: any = localStorage.getItem("lastToastTime");
        const now: any = Date.now();

        if (!lastToastTime || now - lastToastTime > 2000) {
            addToast(message, status);
            localStorage.setItem("lastToastTime", now);
        }
    }

    const fetchUserAttributes = async () => {
        const message = {
            type: "action",
            action: "GetEntity",
            env: {
                user: userId,
                all: true
            },
            params: {
                entityName: "entity",
                primaryKey: entityName
            }
        };
        console.log("sending messsage", message);
        websocketStore.sendMessage(message);
    };

    const fetchUsers = () => {
        listEntityData.set([]);

        const message = {
            type: "action",
            action: "ListEntity",
            env: {
                user: userId,
                all: true
            },
            params: {
                entityName: entityName,
                filter: ["display_name", "roles", "user", "pass_hash"]
            }
        };
        console.log("sending messsage", message);
        websocketStore.sendMessage(message);
    };

    const fetchRoles = (entityname: string) => {
        rolesData.set([]);
        const message = {
            type: "action",
            action: "ListEntity",
            env: {
                user: userId
            },
            params: {
                entityName: entityname,
                all: true
            }
        };

        console.log("sending messsage", message);
        websocketStore.sendMessage(message);
    };

    const updateUserName = (primaryKey: string, updatedData: any) => {
        const message = {
            type: "action",
            action: "UpdateEntity",
            env: {
                user: userId
            },
            params: {
                entityName,
                "user": primaryKey,
                updates: updatedData
            }
        }
        console.log("sending messsage for update user name", message);
        websocketStore.sendMessage(message);
    };

    const updateUserPassword = (userID: string, newPassword: string) => {
        const message = {
            type: "action",
            action: "ChangeUserPassword",
            env: {
                user: userId
            },
            params: {
                entityName,
                "user": userID,
                "newPassword": newPassword
            }
        }
        console.log("messageforupdatepassword", message);
        websocketStore.sendMessage(message);
    };

    const deleteUser = (primarykey: string) => {
        const message = {
            type: "action",
            action: "RemoveEntity",
            env: {
                user: userId
            },
            params: {
                entityName,
                primaryKey: primarykey
            }
        }
        console.log("messageuserdelete", message);
        websocketStore.sendMessage(message);
    };

    const addUser = (username: string, password: string) => {
        const message = {
            type: "action",
            action: "AddNewUser",
            env: {
                user: userId
            },
            params: {
                entityName,
                display_name: username,
                password: password
            }
        }
        console.log("messageddduser", message);
        websocketStore.sendMessage(message);
    };

    const removeRoles = (selectedRoles: string[], activeMenuUserId: string) => {
        const message = {
            type: "action",
            action: "UserRoleRemove",
            env: {
                user: userId
            },
            params: {
                entityName,
                user: activeMenuUserId,
                roleName: selectedRoles
            }
        }
        console.log("messagerolesremove", message);
        websocketStore.sendMessage(message);
    };

    const addRoles = (selectedRoles: string[], activeMenuUserId: string) => {
        const message = {
            type: "action",
            action: "UserRoleAdd",
            env: {
                user: userId
            },
            params: {
                entityName,
                user: activeMenuUserId,
                roleName: selectedRoles
            }
        }
        console.log("messagerolesadd", message);
        websocketStore.sendMessage(message);
    };

    const parseUserData = (data: string) => {
        try {
            const parseData = JSON.parse(data);
            return parseData;
        } catch (error) {
            console.error(`Error parsing ${entityName} data:`, error);
            return [];
        }
    };

    const handleWebSocketMessage = (message: any) => {
        if (!message?.result?.code) return;

        const { action, result, params } = message;
        const successCode = result.code;

        if ((result.code).substring(0, 3) === "ERR") {
            listEntityData.set([]);
            handleToast("something is going wrong", "error");
        }
        switch (action) {
            case "ListEntity":
                if (successCode === "SUCCESS200" && params?.result) {
                    if (entityName == "role") {
                        listEntityData.set(parseUserData(params?.result))
                    } else if (entityName == "user") {
                        listEntityData.set(parseUserData(params?.result));
                    }
                    console.log("listEntityData", parseUserData(params?.result));
                }
                break;
            case "GetEntity":
                if (successCode == "SUCCESS200" && params[entityName]) {
                    const parseAttributeData = (JSON.parse(params[entityName])).attributes || [];
                    userAttributes.set(parseAttributeData);
                    console.log("userAttributes", parseAttributeData);
                }
            case "UpdateEntity":
                if (successCode === "SUCCESS199") {
                    handleToast("user name updated successfully", "success");
                    fetchUsers();
                }
                break;
            case "RemoveEntity":
                if (successCode === "SUCCESS220") {
                    handleToast("user deleted successfully", "success");
                    fetchUsers();
                }
                break;
            case "AddEntity":
                if (successCode === "SUCCESS122") {
                }
                break;
            case "ChangeUserPassword":
                if (successCode === "SUCCESS200") {
                    handleToast("user passward updated successfully", "success");
                }
                break;
            case "AddUser":
                if (successCode === "SUCCESS122") {
                    handleToast("user added successfully", "success");
                    fetchUsers();
                }
                break;
            case "UserRoleRemove":
                if (successCode === "SUCCESS2002") {
                    handleToast("roles removed successfully", "success");
                    fetchUsers();
                }
                break;
            case "UserRoleAdd":
                if (successCode === "SUCCESS2000") {
                    handleToast("roles added successfully", "success");
                    fetchUsers();
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

            if ($websocketStore.messageModal) {
                messageModal.set($websocketStore.messageModal);
            }
        }
    });

    return {
        isConnected,
        userAttributes,
        listEntityData,
        fetchUserAttributes,
        fetchUsers,
        addUser,
        fetchRoles,
        removeRoles,
        addRoles,
        updateUserName,
        deleteUser,
        updateUserPassword
    };
}

