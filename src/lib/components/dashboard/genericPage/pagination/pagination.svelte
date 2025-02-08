<script lang="ts">
    import { entityStore } from "$lib/stores/apiStores/entityStores";
    import { onMount } from "svelte";
    export let entityName: string;
    export let selectedAttributeForSorting: string;
    export let selectedSortingOrder: string;
    let limit: number = 5;
    let currentPage: any = 1;

    interface NextOffset {
        [field: string]: number;
    }

    const { requestid, hasmore, totalrecords, fetchEntities } =
        entityStore(entityName);

    const handleNextOffset = (nextoffset: number) => {
        let parseData: NextOffset = {};
        let localEntityNextOffset = localStorage.getItem("entityNextOffset");
        if (localEntityNextOffset) {
            parseData = JSON.parse(localEntityNextOffset);
        }
        parseData[entityName] = nextoffset;
        localStorage.setItem("entityNextOffset", JSON.stringify(parseData));
    };

    onMount(() => {
        handleNextOffset(0);
    });

    const handleNextPage = (
        limit: number,
        offset: number,
        $requestid: string,
        arrayOfAttributes: string[],
    ) => {
        let localFilterByValues = localStorage.getItem("filterByValues");

        let parseData =
            localFilterByValues &&
            localFilterByValues != "{}" &&
            JSON.parse(localFilterByValues)[entityName] != undefined
                ? JSON.parse(localFilterByValues)[entityName]
                : {};

        fetchEntities(
            limit,
            offset,
            $requestid,
            arrayOfAttributes,
            selectedAttributeForSorting,
            selectedSortingOrder,
            parseData,
        );
        handleNextOffset(0);
    };
</script>

<div
    class="flex justify-between items-center mt-6 text-sm text-gray-700 font-sans"
>
    <div>Showing 1 to {limit} of {$totalrecords} entries</div>
    <div
        class="flex justify-between items-center text-sm text-gray-700 font-sans"
    >
        <div class="flex items-center space-x-2">
            <button
                class="px-2 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                on:click={() => {
                    currentPage = 1;
                    handleNextPage(limit, 0, $requestid, []);
                    handleNextOffset(0);
                }}
                disabled={currentPage === 1}
            >
                &laquo;
            </button>

            <button
                class="px-2 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                on:click={() => {
                    currentPage--;
                    handleNextPage(
                        limit,
                        (currentPage - 1) * limit,
                        $requestid,
                        [],
                    );
                    handleNextOffset((currentPage - 1) * limit);
                }}
                disabled={currentPage === 1}
            >
                &lsaquo;
            </button>

            {#each Array(Math.ceil(Number($totalrecords) / Number(limit))).fill(0) as _, index}
                {#if index < 6 || index === Math.ceil(Number($totalrecords) / Number(limit)) - 1 || (index >= currentPage - 2 && index <= currentPage)}
                    <button
                        class={`px-2 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-200 ${
                            currentPage == index + 1 ? "bg-gray-200" : ""
                        }`}
                        on:click={() => {
                            currentPage = index + 1;
                            handleNextPage(
                                limit,
                                index * limit,
                                $requestid,
                                [],
                            );
                            handleNextOffset(index * limit);
                        }}
                    >
                        {index + 1}
                    </button>
                {:else if index === 6 || (index === currentPage + 2 && currentPage < Math.ceil(Number($totalrecords) / Number(limit)) - 4)}
                    <span class="px-2 py-1 text-gray-600">...</span>
                {/if}
            {/each}

            <button
                class="px-2 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                on:click={() => {
                    currentPage++;
                    handleNextPage(
                        limit,
                        (currentPage - 1) * limit,
                        $requestid,
                        [],
                    );
                    handleNextOffset((currentPage - 1) * limit);
                }}
                disabled={!$hasmore}
            >
                &rsaquo;
            </button>

            <button
                class="px-2 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!$hasmore}
                on:click={() => {
                    currentPage = Math.ceil(
                        Number($totalrecords) / Number(limit),
                    );
                    handleNextPage(
                        limit,
                        $totalrecords - limit,
                        $requestid,
                        [],
                    );
                    handleNextOffset($totalrecords - limit);
                }}
            >
                &raquo;
            </button>
        </div>
    </div>
</div>
