<script lang="ts">
    import { fade, slide } from "svelte/transition";
    import add from "$lib/../../src/assests/images/genericPage/add01.png";
    import { onMount } from "svelte";
    import { userStore } from "$lib/stores/apiStores/userStore";

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
    export let activeMenuUserId: string | null;
    export let selectedUser: SelectedUserType | null;

    let selectedRoles: string[] = [];
    let selectAll: boolean = false;
    let filteredListEntityData: RoleEntity[] = [];

    const { listEntityData, fetchRoles } = userStore("role");

    onMount(() => {
        fetchRoles("role");
    });

    const handleSelectAll = () => {
        selectAll = !selectAll;
        if (selectAll) {
            selectedRoles = selectedUser?.roles || [];
        } else {
            selectedRoles = [];
        }
    };

    const handleRoleSelect = (role: string) => {
        const index = selectedRoles.indexOf(role);
        if (index === -1) {
            selectedRoles = [...selectedRoles, role];
        } else {
            selectedRoles = selectedRoles.filter((r) => r !== role);
        }
        selectAll = selectedUser?.roles?.length === selectedRoles.length;
    };

    const handleCloseModal = () => {
        activeMenuUserId = "";
        showUserRolesModal = false;
        selectedUser = null;
        selectedRoles = [];
        selectAll = false;
    };

    $: {
        if ($listEntityData && selectedUser?.roles) {
            filteredListEntityData = ($listEntityData as RoleEntity[]).filter(
                (entityRole: RoleEntity) =>
                    !selectedUser?.roles.includes(entityRole.role),
            );
        } else {
            filteredListEntityData = [];
        }
    }
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
    <!-- First section remains the same -->
    <div class="flex items-center justify-end p-2">
        <button
            aria-label="close"
            class="text-gray-400 hover:text-gray-500 transition-colors duration-200"
            on:click={() => handleCloseModal()}
        >
            <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                />
            </svg>
        </button>
    </div>

    <div class="grid grid-cols-5 h-[500px] shadow-xl">
        <div class="col-span-2">
            <div
                class="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 z-10"
            >
                <div class="flex items-center justify-start">
                    <h3 class="text-gray-900 font-medium px-3">
                        User {activeMenuUserId} Roles
                    </h3>
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
                            Select All Roles
                        </span>
                    </label>
                </div>
            </div>

            <div class="px-6 py-4">
                {#if selectedUser?.roles?.length}
                    <ul
                        class="space-y-2 overflow-y-auto scrollbar-beautiful h-[350px]"
                    >
                        {#each selectedUser.roles as role, i}
                            <li
                                class="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-200 ease-in-out transform hover:scale-[1.01] w-[80%]"
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
                    <p class="text-gray-500 text-center py-4 scrollbar-beautiful h-[350px]">
                        No roles assigned
                    </p>
                {/if}
            </div>

            <div
                class="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-200"
            >
                <div class="flex justify-end space-x-3">
                    <button
                        class="px-4 py-2 bg-red-600 text-xs text-white rounded-md transition-all duration-200"
                        on:click={() => {
                            console.log("selectedRoles", selectedRoles);
                        }}
                    >
                        Remove Roles
                    </button>
                </div>
            </div>
        </div>

        <div class="col-span-3">
            <div
                class="sticky top-0 bg-white border-b border-gray-200 z-10 px-6 py-4"
            >
                <div class="flex items-center justify-start">
                    <h3 class="text-gray-900 font-medium px-3">Add Roles</h3>
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
                            Select All Roles
                        </span>
                    </label>
                </div>
            </div>
            <div class="px-6 py-4">
                <ul
                    class="space-y-2 overflow-y-auto scrollbar-beautiful h-[350px]"
                >
                    {#each filteredListEntityData as roles}
                        <li
                            class="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-200 ease-in-out transform hover:scale-[1.01] w-[80%]"
                        >
                            <label
                                class="flex items-center gap-3 cursor-pointer flex-1"
                            >
                                <input
                                    type="checkbox"
                                    class="form-checkbox h-4 w-4 transition duration-200 ease-in-out rounded border-gray-300"
                                />
                                <span class="text-gray-700 flex-1 text-sm"
                                    >{roles.role}</span
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
                        Cancel
                    </button>
                    <button
                        class="px-4 py-2 bg-[#34495E] text-xs text-white rounded-md transition-all duration-200"
                        on:click={() => {
                            console.log("selectedRoles", selectedRoles);
                        }}
                    >
                        Add Roles
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
