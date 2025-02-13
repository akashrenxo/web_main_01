<script lang="ts">
    import { userStore } from "$lib/stores/apiStores/userStore";

    export let showUserDeleteModal;
    export let activeMenuUserId;

    const { deleteUser } = userStore("user");

    const handleSubmit = () => {
        deleteUser(activeMenuUserId);
        showUserDeleteModal = false;
    };

</script>

<div
    class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 text-sm"
>
    <div class="bg-white rounded-lg shadow-lg p-6 w-[400px]">
        <h2 class="text-sm font-medium mb-4">Delete {activeMenuUserId}</h2>
        <p class="mb-4 text-sm">
            Are you sure you want to delete ? This action cannot be undone.
        </p>
        <div class="flex justify-end space-x-4">
            <button
                type="button"
                class="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg text-xs"
                on:click={() => {
                    showUserDeleteModal = false;
                }}
            >
                Cancel
            </button>
            <button
                type="button"
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs"
                on:click={() => {
                    handleSubmit();
                }}
            >
                Delete
            </button>
        </div>
    </div>
</div>
