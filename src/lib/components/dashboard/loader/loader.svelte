<script lang="ts">
    export let show = true;
</script>

{#if show}
    <div class="flex flex-row justify-center py-10">
        <div class="relative">
            <div
                class="w-12 h-12 rounded-full border-4 border-t-indigo-500 animate-spin"
            ></div>
        </div>
    </div>
{/if}

<style>
</style>
