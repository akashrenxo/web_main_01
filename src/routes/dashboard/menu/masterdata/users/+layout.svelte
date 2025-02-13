<script lang="ts">
    import { userStore } from "$lib/stores/apiStores/userStore";
    import Cookies from "js-cookie";
    import { onMount } from "svelte";
    import { websocketStore } from "$lib/stores/websocket";
    import { fade } from "svelte/transition";

    import deleteButton from "$lib/../../src/assests/images/supplier/deleteButton.png";
    import viewDetails from "$lib/../../src/assests/images/genericPage/view.png";
    import add from "$lib/../../src/assests/images/genericPage/add01.png";
    import verticalMenu from "$lib/../../src/assests/images/genericPage/verticalMenu.png";
    import password from "$lib/../../src/assests/images/genericPage/password.png";
    import rename from "$lib/../../src/assests/images/genericPage/rename01.png";

    import { writable, type Writable } from "svelte/store";

    const wsURL = Cookies.get("url") || "";
    const userId = Cookies.get("userId") || "";

    import ForgetPasswordModal from "$lib/components/dashboard/user/modal/forgetPasswordModal.svelte";
    import AddNewUserModal from "$lib/components/dashboard/user/modal/addNewUserModal.svelte";
    import DeleteUserModal from "$lib/components/dashboard/user/modal/deleteUserModal.svelte";
    import UserEditModal from "$lib/components/dashboard/user/modal/userEditModal.svelte";
    import ShowUserRolesModal from "$lib/components/dashboard/user/modal/showUserRolesModal.svelte";

    let showUserRolesModal = false;
    let selectedUser: any = null;
    let showUserEditModal: boolean = false;
    let showEditMenu: boolean = false;
    let showUserDeleteModal: boolean = false;
    let showUserPasswordModal: boolean = false;
    let showAddUserModal: boolean = false;
    let activeMenuUserId: string = "";
    let menuNode: HTMLElement;
    let selectedUserName: string = "";

    const handleShowModal = (user: any) => {
        selectedUser = user;
        showUserRolesModal = true;
    };

    const {
        isConnected,
        userAttributes,
        usersData,
        fetchUserAttributes,
        fetchUsers,
    } = userStore("user");

    const handleClickOutside = (event: MouseEvent) => {
        if (
            showEditMenu &&
            menuNode &&
            !menuNode.contains(event.target as Node)
        ) {
            showEditMenu = false;
            activeMenuUserId = "";
        }
    };

    onMount(() => {
        document.addEventListener("click", handleClickOutside);
        let connectionAttempts = 0;
        const maxAttempts = 5;
        const attemptInterval = 5000;

        const attemptConnection = async () => {
            if (!$isConnected && connectionAttempts < maxAttempts) {
                console.log(
                    `Connection attempt ${connectionAttempts + 1} of ${maxAttempts}`,
                );
                try {
                    await websocketStore.connect(wsURL, userId);
                    connectionAttempts++;
                } catch (error) {
                    console.error("Connection error:", error);
                }
            }
        };

        const fetchData = async () => {
            if ($isConnected) {
                try {
                    await fetchUserAttributes();
                    await fetchUsers();
                    console.log("Data fetched successfully");
                    return true;
                } catch (error) {
                    console.error("Error fetching data:", error);
                    return false;
                }
            }
            return false;
        };

        const initialize = async () => {
            while (connectionAttempts < maxAttempts && !$isConnected) {
                await attemptConnection();
                if ($isConnected) {
                    break;
                }
                await new Promise((resolve) =>
                    setTimeout(resolve, attemptInterval),
                );
            }

            if ($isConnected) {
                const dataFetched = await fetchData();
                if (!dataFetched) {
                    console.log("Retrying data fetch...");
                    await fetchData();
                }
            } else {
                console.error(
                    "Max connection attempts reached. Could not connect.",
                );
            }
        };

        initialize();
        return () => {
            document.removeEventListener("click", handleClickOutside);
            console.log("Component unmounted. Cleaning up...");
        };
    });

    $: {
        if ($userAttributes && $userAttributes.length > 0) {
            console.log("userAttributes01", $userAttributes);
        }
    }

    let offsetFromTop: Writable<any> = writable([]);

    $: {
        const getElementOffset = (element: HTMLElement | null): number => {
            if (!element) return 0;
            return element.getBoundingClientRect().top + window.scrollY;
        };

        const element = document.getElementById("verticalMenu");

        if (element) {
            offsetFromTop.set(getElementOffset(element));
        }
    }
</script>

{#if $isConnected}
    <div class="w-full max-w-7xl mx-auto px-4 py-8 z-0">
        <div class="flex justify-end gap-4 font-poppins text-sm">
            <button
                class="bg-[#00B894] text-white px-4 py-2 rounded-lg shadow transition-all"
                on:click={() => {
                    showAddUserModal = true;
                }}
            >
                Add User
            </button>
        </div>
        <div class="relative h-[450px] rounded-lg shadow-md mt-5">
            <div class="overflow-auto h-full scrollbar-beautiful">
                {#if $userAttributes && $userAttributes.length > 0}
                    <table
                        class="table-auto w-full text-sm border text-gray-700 bg-white"
                        style="border-collapse: collapse;"
                    >
                        <thead class="sticky top-0 bg-gray-50 z-[5]">
                            <tr class="bg-gray-100">
                                {#each $userAttributes.filter((attr: any) => !["custom_menu", "customMobile_Menu", "customWeb_Menu", "pass_hash"].includes(attr.name)) as attribute (attribute.name)}
                                    <th
                                        class="px-6 py-4 text-left text-sm font-normal text-gray-800 uppercase tracking-wider"
                                    >
                                        {attribute.name
                                            .replace(/_/g, " ")
                                            .toUpperCase()}
                                    </th>
                                {/each}
                                <th
                                    class="px-6 py-4 text-left text-sm font-normal text-gray-800 uppercase tracking-wider w-32"
                                >
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody class="">
                            {#each $usersData as user}
                                <tr
                                    class={`${activeMenuUserId === user["user"] ? "bg-[#34495E]/25" : ""} hover:bg-gray-50 transition-colors duration-200 even:bg-gray-50`}
                                    on:click={() => {}}
                                >
                                    {#each $userAttributes.filter((attr: any) => !["custom_menu", "customMobile_Menu", "customWeb_Menu", "pass_hash"].includes(attr.name)) as attribute}
                                        <td
                                            class={`${attribute.name === "roles" ? "px-0" : "px-6"} py-4 text-sm text-gray-600 whitespace-nowrap`}
                                        >
                                            {#if attribute.name === "roles"}
                                                <button
                                                    on:click={() => {
                                                        activeMenuUserId =
                                                            user["user"];
                                                        handleShowModal(user);
                                                    }}
                                                    class="inline-flex items-center text-gray-700"
                                                >
                                                    <img
                                                        src={viewDetails}
                                                        alt="viewDetails"
                                                        class=" h-5 mr-2"
                                                    />
                                                    View Roles
                                                </button>
                                            {:else}
                                                <p class="">
                                                    {user[attribute.name] || ""}
                                                </p>
                                            {/if}
                                        </td>
                                    {/each}
                                    <td
                                        class="px-6 py-4 whitespace-nowrap text-sm text-gray-600"
                                    >
                                        <div
                                            class="flex flex-row items-center space-x-4"
                                        >
                                            <button
                                                class="transition-colors duration-200"
                                                title="Delete"
                                                aria-label="delete"
                                                on:click={() => {
                                                    showUserDeleteModal = true;
                                                    activeMenuUserId =
                                                        user["user"];
                                                }}
                                            >
                                                <img
                                                    src={deleteButton}
                                                    alt="deleteButton"
                                                    class="h-5"
                                                />
                                            </button>
                                            <button
                                                id="verticalMenu"
                                                class="transition-colors duration-200"
                                                title="verticalMenu"
                                                aria-label="verticalMenu"
                                                on:click|stopPropagation={() => {
                                                    showEditMenu = true;
                                                    activeMenuUserId =
                                                        user["user"];
                                                }}
                                            >
                                                <img
                                                    src={verticalMenu}
                                                    alt="verticalMenu"
                                                    class="h-4"
                                                />
                                            </button>
                                        </div>
                                        {#if showEditMenu && activeMenuUserId === user["user"]}
                                            <div
                                                bind:this={menuNode}
                                                class="absolute top-{$offsetFromTop} right-24 mt-2 rounded-md bg-white shadow-lg z-[999] origin-top-right"
                                                in:fade={{ duration: 200 }}
                                                out:fade={{ duration: 200 }}
                                                style="filter: drop-shadow(0 0 10px rgba(0,0,0,0.1));"
                                            >
                                                <div class="py-1 min-w-[160px]">
                                                    <button
                                                        class=" w-full px-2 py-2 text-left text-gray-700 hover:bg-gray-100 text-xs"
                                                        on:click={() => {
                                                            showUserEditModal = true;
                                                            showEditMenu = false;
                                                            selectedUserName =
                                                                user[
                                                                    "display_name"
                                                                ];
                                                        }}
                                                    >
                                                        <p
                                                            class=" flex flex-row items-center space-x-1"
                                                        >
                                                            <img
                                                                src={rename}
                                                                alt="rename"
                                                                class=" h-5"
                                                            />
                                                            <span
                                                                class=" font-medium"
                                                            >
                                                                change user name
                                                            </span>
                                                        </p>
                                                    </button>
                                                    <button
                                                        class="block w-full px-2 py-2 text-left text-gray-700 hover:bg-gray-100 text-xs"
                                                        on:click={() => {
                                                            showUserPasswordModal = true;
                                                            showEditMenu = false;
                                                            activeMenuUserId =
                                                                user["user"];
                                                        }}
                                                    >
                                                        <p
                                                            class=" flex flex-row items-center space-x-1"
                                                        >
                                                            <img
                                                                src={password}
                                                                alt="password"
                                                                class=" h-5"
                                                            />
                                                            <span
                                                                class=" font-medium"
                                                            >
                                                                change password
                                                            </span>
                                                        </p>
                                                    </button>

                                                    <button
                                                        class="block w-full px-2 py-2 text-left text-gray-700 hover:bg-gray-100 text-xs"
                                                    >
                                                        <p
                                                            class=" flex flex-row items-center space-x-2"
                                                        >
                                                            <img
                                                                src={add}
                                                                alt="add01"
                                                                class=" h-4 ml-1/2"
                                                            />
                                                            <span
                                                                class=" font-medium"
                                                            >
                                                                add new role
                                                            </span>
                                                        </p>
                                                    </button>
                                                </div>
                                            </div>
                                        {/if}
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                {/if}
            </div>
        </div>
    </div>
{/if}

{#if showUserRolesModal}
    <ShowUserRolesModal
        bind:showUserRolesModal
        bind:activeMenuUserId
        bind:selectedUser
    />
{/if}

{#if showUserEditModal}
    <UserEditModal bind:showUserEditModal {selectedUserName} />
{/if}

{#if showUserDeleteModal}
    <DeleteUserModal bind:showUserDeleteModal bind:activeMenuUserId />
{/if}

{#if showUserPasswordModal}
    <ForgetPasswordModal bind:activeMenuUserId bind:showUserPasswordModal />
{/if}

{#if showAddUserModal}
    <AddNewUserModal bind:showAddUserModal />
{/if}

<slot />

<style>
    .scrollbar-beautiful {
        scrollbar-width: thin;
        scrollbar-color: #aaa #f0f0f0;
    }

    .scrollbar-beautiful::-webkit-scrollbar {
        width: 8px;
        height: 8px;
    }

    .scrollbar-beautiful::-webkit-scrollbar-thumb {
        background-color: #aaa;
        border-radius: 12px;
    }

    .scrollbar-beautiful::-webkit-scrollbar-thumb:hover {
        background-color: #888;
    }

    .scrollbar-beautiful::-webkit-scrollbar-track {
        background-color: #f0f0f0;
        border-radius: 12px;
    }

    td {
        max-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
</style>
