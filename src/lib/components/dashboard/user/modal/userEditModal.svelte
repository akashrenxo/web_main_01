<script lang="ts">
    import { fade } from "svelte/transition";

    export let showUserEditModal;
    export let selectedUserName: string;
    
</script>

<div
    class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 text-sm"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
    transition:fade={{ duration: 200 }}
>
    <div class="bg-white rounded-lg shadow-lg p-6 w-[400px]">

        <h2 class="text-sm font-medium mb-4">Edit User Name</h2>

        <input
            placeholder="user name"
            class=" px-2 py-2.5 border rounded-md placeholder:text-xs min-w-[80%] focus:outline-blue-400 text-xs"
            bind:value={selectedUserName}
        />
        <div class="flex justify-end space-x-4 mt-5">
            <button
                type="button"
                class="px-4 py-2 bg-gray-300 text-xs font-medium text-gray-600 hover:bg-gray-400 rounded-md"
                on:click={() => {
                    showUserEditModal = false;
                }}
            >
                Cancel
            </button>
            <button
                type="button"
                class="px-4 py-2 bg-[#34495E] text-xs font-medium text-white rounded-md"
            >
                Update
            </button>
        </div>
    </div>
</div>
