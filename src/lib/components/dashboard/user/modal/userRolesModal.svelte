<script lang="ts">
    import { slide } from "svelte/transition";
    import { onMount } from "svelte";
    import { userStore } from "$lib/stores/apiStores/userStore";
    import leftArrow from "$lib/../../src/assests/images/genericPage/leftArrow.png";

    interface RoleEntity {
        permissions: string[];
        role: string;
    }

    interface SelectedUserType {
        roles: string[];
        [key: string]: any;
    }

    let modalNode: HTMLDivElement;

    export let showUserRolesModal: boolean;
    export let activeMenuUserId: string;
    export let selectedUser: SelectedUserType | null;

    let selectedRoles: string[] = [];
    let selectedRolesForAdding: string[] = [];
    let selectAll: boolean = false;
    let selectAllForAdding: boolean = false;
    let filteredListEntityData: string[] = [];

    // Add search state
    let managedRolesSearch: string = "";
    let availableRolesSearch: string = "";

    const { listEntityData, fetchRoles } = userStore("role");
    const { removeRoles, addRoles } = userStore("user");

    onMount(() => {
        fetchRoles("role");
    });

    const handleSelectAll = () => {
        selectAll = !selectAll;
        if (selectAll) {
            selectedRoles = getFilteredManagedRoles();
        } else {
            selectedRoles = [];
        }
    };

    const handleSelectAllForAdding = () => {
        selectAllForAdding = !selectAllForAdding;
        if (selectAllForAdding) {
            selectedRolesForAdding = getFilteredAvailableRoles();
        } else {
            selectedRolesForAdding = [];
        }
    };

    const getFilteredManagedRoles = () => {
        if (!selectedUser?.roles) return [];
        console.log("selectedUser", selectedUser);
        return selectedUser.roles.filter((role) =>
            role.toLowerCase().includes(managedRolesSearch.toLowerCase()),
        );
    };

    const getFilteredAvailableRoles = () => {
        console.log("filteredListEntityData", filteredListEntityData);
        return filteredListEntityData.filter((role) =>
            role.toLowerCase().includes(availableRolesSearch.toLowerCase()),
        );
    };

    const handleRoleSelect = (role: string) => {
        const index = selectedRoles.indexOf(role);
        if (index === -1) {
            selectedRoles = [...selectedRoles, role];
        } else {
            selectedRoles = selectedRoles.filter((r) => r !== role);
        }
        selectAll = getFilteredManagedRoles().length === selectedRoles.length;
    };

    const handleRoleSelectForAdding = (role: string) => {
        const index = selectedRolesForAdding.indexOf(role);
        if (index === -1) {
            selectedRolesForAdding = [...selectedRolesForAdding, role];
        } else {
            selectedRolesForAdding = selectedRolesForAdding.filter(
                (r) => r !== role,
            );
        }
        selectAllForAdding =
            getFilteredAvailableRoles().length ===
            selectedRolesForAdding.length;
    };

    const handleCloseModal = () => {
        activeMenuUserId = "";
        showUserRolesModal = false;
        selectedUser = null;
        selectedRoles = [];
        selectAll = false;
        managedRolesSearch = "";
        availableRolesSearch = "";
    };

    $: {
        if ($listEntityData && selectedUser?.roles) {
            filteredListEntityData = ($listEntityData as RoleEntity[])
                .filter(
                    (entityRole: RoleEntity) =>
                        !selectedUser?.roles.includes(entityRole.role),
                )
                .map((entityRole: RoleEntity) => entityRole.role);
        } else {
            filteredListEntityData = [];
        }
    }

    const handleRemoveRoles = (selectedroles: string[]) => {
        if (selectedroles.length > 0) {
            try {
                removeRoles(selectedroles, activeMenuUserId);
            } catch (error) {
                console.log("something is going wrong");
            }
        }
        showUserRolesModal = false;
    };

    const handleAddRoles = (selectedRolesForAdding: string[]) => {
        if (selectedRolesForAdding.length > 0) {
            try {
                addRoles(selectedRolesForAdding, activeMenuUserId);
            } catch (error) {
                console.log("something going wrong");
            }
        }
        showUserRolesModal = false;
    };
</script>

<div
    bind:this={modalNode}
    class="w-full max-w-7xl mx-auto bg-white rounded-md scrollbar-beautiful text-sm transform transition-transform duration-500 ease-out border font-sans"
    class:translate-x-0={showUserRolesModal}
    class:-translate-x-0={!showUserRolesModal}
    role="dialog"
    aria-modal="true"
    in:slide={{ duration: 300, delay: 100, axis: "x" }}
    out:slide={{ duration: 500, axis: "x" }}
>
    <div class="flex items-center justify-start p-2">
        <button
            aria-label="close"
            class="text-gray-400 hover:text-gray-500 transition-colors duration-200"
            on:click={() => handleCloseModal()}
        >
            <img src={leftArrow} alt="leftArrow" class="h-5 ml-3 mt-2" />
        </button>
    </div>

    <div class="grid grid-cols-5 h-[500px] shadow-xl">
        <div class="col-span-2">
            <div
                class="sticky top-0 bg-white px-6 py-2 border-b border-gray-200 z-10"
            >
                <div class="flex items-center justify-start">
                    <h3 class="text-gray-900 font-medium px-3">
                        Manage Roles for User {activeMenuUserId}
                    </h3>
                </div>

                <!-- Add search input for managed roles -->
                <div class="mt-2 px-3">
                    <input
                        type="text"
                        bind:value={managedRolesSearch}
                        placeholder="Search managed roles..."
                        class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div class="mt-4 flex items-center justify-between">
                    <label
                        class="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer group px-3"
                    >
                        <input
                            type="checkbox"
                            checked={selectAll}
                            on:change={handleSelectAll}
                            class="form-checkbox h-4 w-4 transition duration-200 ease-in-out rounded border-gray-30 hover:cursor-pointer"
                        />
                        <span
                            class="group-hover:text-gray-900 transition-colors duration-200"
                        >
                            Select All Assigned Roles
                        </span>
                    </label>
                </div>
            </div>

            <div class="px-6 py-2">
                {#if selectedUser?.roles?.length}
                    <ul
                        class="space-y-2 overflow-y-auto scrollbar-beautiful h-[350px]"
                    >
                        {#each getFilteredManagedRoles() as role}
                            <li
                                class="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-200 ease-in-out transform w-[80%]"
                            >
                                <label
                                    class="flex items-center gap-3 cursor-pointer flex-1"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedRoles.includes(role)}
                                        on:change={() => handleRoleSelect(role)}
                                        class="form-checkbox h-4 w-4 transition duration-200 ease-in-out rounded border-gray-300"
                                    />
                                    <span class="text-gray-700 flex-1 text-sm"
                                        >{role}</span
                                    >
                                </label>
                            </li>
                        {/each}
                    </ul>
                {:else}
                    <p
                        class="text-gray-500 text-center py-4 scrollbar-beautiful h-[350px]"
                    >
                        No roles currently assigned to this user
                    </p>
                {/if}
            </div>

            <div
                class="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-200"
            >
                <div class="flex justify-end space-x-3">
                    <button
                        class="px-4 py-2 bg-red-600 text-xs text-white rounded-md transition-all duration-200"
                        disabled={selectedRoles.length == 0}
                        on:click={() => handleRemoveRoles(selectedRoles)}
                    >
                        Remove Selected Roles
                    </button>
                </div>
            </div>
        </div>

        <div class="col-span-3">
            <div
                class="sticky top-0 bg-white border-b border-gray-200 z-10 px-6 py-2"
            >
                <div class="flex items-center justify-start">
                    <h3 class="text-gray-900 font-medium px-3">
                        Available Roles
                    </h3>
                </div>

                <!-- Add search input for available roles -->
                <div class="mt-2 px-3">
                    <input
                        type="text"
                        bind:value={availableRolesSearch}
                        placeholder="Search available roles..."
                        class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div class="mt-4 flex items-center justify-between">
                    <label
                        class="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer group px-3"
                    >
                        <input
                            type="checkbox"
                            checked={selectAllForAdding}
                            on:change={handleSelectAllForAdding}
                            class="form-checkbox h-4 w-4 transition duration-200 ease-in-out rounded border-gray-30 hover:cursor-pointer"
                        />
                        <span
                            class="group-hover:text-gray-900 transition-colors duration-200"
                        >
                            Select All Available Roles
                        </span>
                    </label>
                </div>
            </div>

            <div class="px-6 py-2">
                <ul
                    class="space-y-2 overflow-y-auto scrollbar-beautiful h-[350px]"
                >
                    {#each filteredListEntityData as role}
                        <li
                            class="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-200 ease-in-out transform w-[80%]"
                        >
                            <label
                                class="flex items-center gap-3 cursor-pointer flex-1"
                            >
                                <input
                                    type="checkbox"
                                    class="form-checkbox h-4 w-4 transition duration-200 ease-in-out rounded border-gray-300"
                                    checked={selectedRolesForAdding.includes(
                                        role,
                                    )}
                                    on:change={() =>
                                        handleRoleSelectForAdding(role)}
                                />
                                <span class="text-gray-700 flex-1 text-sm"
                                    >{role}</span
                                >
                            </label>
                        </li>
                    {/each}
                </ul>
            </div>

            <div
                class="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-200"
            >
                <div class="flex justify-end space-x-3">
                    <button
                        class="px-4 py-2 bg-gray-100 text-gray-700 text-xs rounded-md hover:bg-gray-200 active:bg-gray-300 transition-all duration-200"
                        on:click={() => handleCloseModal()}
                    >
                        Cancel Changes
                    </button>
                    <button
                        class="px-4 py-2 bg-[#34495E] text-xs text-white rounded-md transition-all duration-200"
                        disabled={selectedRolesForAdding.length == 0}
                        on:click={() => handleAddRoles(selectedRolesForAdding)}
                    >
                        Assign Selected Roles
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

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
</style>
