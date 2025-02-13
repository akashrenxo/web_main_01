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
    const usersData: Writable<any> = writable([]);
    const userAttributes: Writable<any> = writable([]);
    const isConnected: Writable<boolean> = writable(false);
    const messageModal: Writable<MessageModal | null> = writable(null);

    const fetchUserAttributes = async () => {
        const message = {
            type: "action",
            action: "GetEntity",
            env: {
                user: userId
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
        usersData.set([]);

        const message = {
            type: "action",
            action: "ListEntity",
            env: {
                user: userId
            },
            params: {
                entityName: entityName,
                filter: ["display_name", "roles", "user", "pass_hash"]
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
            usersData.set([]);
        }
        switch (action) {
            case "ListEntity":
                if (successCode === "SUCCESS200" && params?.result) {
                    usersData.set(parseUserData(params?.result));
                    console.log("userData", params.result);
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

                }
                break;
            case "RemoveEntity":
                if (successCode === "SUCCESS220") {
                    const lastToastTime: any = localStorage.getItem("lastToastTime");
                    const now: any = Date.now();

                    if (!lastToastTime || now - lastToastTime > 2000) {
                        addToast(("user deleted successfully"), "success");
                        localStorage.setItem("lastToastTime", now);
                    }
                    fetchUsers();
                }
                break;
            case "AddEntity":
                if (successCode === "SUCCESS122") {
                }
                break;
            case "ChangeUserPassword":
                if (successCode === "SUCCESS200") {
                    const lastToastTime: any = localStorage.getItem("lastToastTime");
                    const now: any = Date.now();

                    if (!lastToastTime || now - lastToastTime > 2000) {
                        addToast(("user passward updated successfully"), "success");
                        localStorage.setItem("lastToastTime", now);
                    }
                }
                break;
            case "AddUser":
                if (successCode === "SUCCESS122") {
                    const lastToastTime: any = localStorage.getItem("lastToastTime");
                    const now: any = Date.now();

                    if (!lastToastTime || now - lastToastTime > 2000) {
                        addToast(("user added successfully"), "success");
                        localStorage.setItem("lastToastTime", now);
                    }
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
        usersData,
        fetchUserAttributes,
        fetchUsers,
        addUser,
        updateUserName,
        deleteUser,
        updateUserPassword
    };
}

