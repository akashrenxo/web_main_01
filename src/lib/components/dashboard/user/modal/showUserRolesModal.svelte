<script lang="ts">
    import { fade, slide } from "svelte/transition";

    import add from "$lib/../../src/assests/images/genericPage/add01.png";

    let modalNode: any;

    export let showUserRolesModal: boolean;
    export let activeMenuUserId: string | null;
    export let selectedUser: any;

    const handleCloseModal = () => {
        activeMenuUserId = "";
        showUserRolesModal = false;
        selectedUser = null;
    };
</script>

<div
    class="fixed inset-0 z-50 font-sans"
    in:fade={{ duration: 200 }}
    out:fade={{ duration: 200 }}
>
    <div
        bind:this={modalNode}
        class="fixed right-0 top-0 h-full w-96 bg-white shadow-xl overflow-y-auto scrollbar-beautiful text-sm transform transition-transform duration-500 ease-out"
        class:translate-x-0={showUserRolesModal}
        class:-translate-x-0={!showUserRolesModal}
        role="dialog"
        aria-modal="true"
        in:slide={{ duration: 400, delay: 150, axis: "x" }}
        out:slide={{ duration: 500, axis: "x" }}
    >
        <div
            class="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 z-10"
        >
            <div class="flex items-center justify-between">
                <h3 class=" text-gray-900 font-medium px-3">
                    User {activeMenuUserId} Roles
                </h3>
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

            <div class="mt-4 flex items-center justify-between">
                <label
                    class="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer group px-3"
                >
                    <input
                        type="checkbox"
                        class="form-checkbox h-4 w-4 transition duration-200 ease-in-out rounded border-gray-30 hover:cursor-pointer"
                    />
                    <span
                        class="group-hover:text-gray-900 transition-colors duration-200"
                        >Select All Roles</span
                    >
                </label>

                <button
                    class=" px-1 py-1 rounded-full border border-[#34495E] text-[#34495E]"
                >
                    <div class=" flex flex-row items-center justify-evenly">
                        <img src={add} alt="add" class=" h-4" />
                    </div>
                </button>
            </div>
        </div>

        <div class="px-6 py-4">
            {#if selectedUser?.roles?.length}
                <ul class="space-y-2">
                    {#each selectedUser.roles as role, i}
                        <li
                            class="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-200 ease-in-out transform hover:scale-[1.01]"
                        >
                            <label
                                class="flex items-center gap-3 cursor-pointer flex-1"
                            >
                                <input
                                    type="checkbox"
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
                <p class="text-gray-500 text-center py-4">No roles assigned</p>
            {/if}
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
                >
                    Remove Roles
                </button>
            </div>
        </div>
    </div>
</div>
