<script lang="ts">
    import edit from "$lib/../../src/assests/images/supplier/edit.png";
    import deleteButton from "$lib/../../src/assests/images/supplier/deleteButton.png";
    import sortingArrows from "$lib/../../src/assests/images/genericPage/sortingArrows.png";
    import filter from "$lib/../../src/assests/images/genericPage/filter01.png";
    import upArrow from "$lib/../../src/assests/images/genericPage/upArrow.png";
    import downArrow from "$lib/../../src/assests/images/genericPage/downArrow.png";

    import { entityStore } from "$lib/stores/apiStores/entityStores";
    import { onMount } from "svelte";
    import { websocketStore } from "$lib/stores/websocket";
    import Cookies from "js-cookie";
    import { writable } from "svelte/store";
    import {
        filterStore,
        filterStoreForAttributes,
        filterActions,
        filterActionsForAttibutes,
        formatLabel,
        loadFiltersFromStorage,
        loadFiltersFromStorageForAttributes,
    } from "$lib/stores/filterStore";
    import { X, Plus } from "lucide-svelte";

    import AddModal from "./modals/addModal/addModal.svelte";
    import DeleteModal from "./modals/deleteModal/deleteModal.svelte";
    import ViewModal from "./modals/viewModal/viewModal.svelte";
    import FilterModal from "./modals/filterModal/filterModal.svelte";
    import EditModal from "./modals/editModal/editModal.svelte";
    import ColumnModal from "./modals/columnModal/columnModal.svelte";
    import Pagination from "./pagination/pagination.svelte";
    import SingleFilterModal from "./modals/singleFilterModal/singleFilterModal.svelte";
    import Loader from "../loader/loader.svelte";

    const wsURL = Cookies.get("url") || "";
    const userId = Cookies.get("userId") || "";

    export let entityName: string;

    let isAddModalOpen: boolean = false;
    let isFilterModalOpen: boolean = false;
    let isEditModalOpen: boolean = false;
    let isDeleteModalOpen: boolean = false;
    let isSingleFilterModalOpen: boolean = false;
    let isViewDetailsModalOpen: boolean = false;
    let isColumnModalOpen: boolean = false;
    let arrowDirection: boolean = true;
    let selectedColumnForDirection: string = "";

    let selectedEntity: any = null; // row data
    let selectedEntityId: any = null; // primary key
    let selectedPrimaryKeyName: any = null;
    let detailedEntity: any = null;
    let limit: number = 5;
    let nextOffset: number = 0;
    let requestId: string = "";
    let entity_address = entityName + "_address";

    const {
        entitiesData,
        attributes,
        isConnected,
        fetchEntities,
        fetchEntityAttributes,
    } = entityStore(entityName);

    const openEditModal = (entity: any) => {
        const idAttribute = $attributes.find((attr) => attr.data_type === "id");
        if (!idAttribute) {
            console.error("No attribute with data_type 'id' found.");
            return;
        }

        selectedPrimaryKeyName = idAttribute.name; // supplier_id
        selectedEntityId = entity[selectedPrimaryKeyName]; // 956b16f7-46b6-4dcb-b273-febdd95a79d2
        selectedEntity = entity; // row data
        isEditModalOpen = true;
    };

    const openDeleteModal = (entity: any) => {
        const idAttribute = $attributes.find((attr) => attr.data_type === "id");
        if (!idAttribute) {
            console.error("No attribute with data_type 'id' found.");
            return;
        }

        selectedPrimaryKeyName = idAttribute.name; // supplier_id
        selectedEntityId = entity[selectedPrimaryKeyName]; // 956b16f7-46b6-4dcb-b273-febdd95a79d2
        isDeleteModalOpen = true;
    };

    const openViewDetailsModal = (entity: any) => {
        detailedEntity = entity;
        isViewDetailsModalOpen = true;
    };

    // build connection, fetch attributes, entities and load filter data from local storage

    onMount(() => {
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
                let localFilterByValues =
                    localStorage.getItem("filterByValues");

                let parseData =
                    localFilterByValues &&
                    localFilterByValues != "{}" &&
                    JSON.parse(localFilterByValues)[entityName] != undefined
                        ? JSON.parse(localFilterByValues)[entityName]
                        : {};
                try {
                    await fetchEntityAttributes();
                    await fetchEntities(
                        limit,
                        nextOffset,
                        requestId,
                        [],
                        "",
                        "",
                        parseData,
                    );
                    loadFiltersFromStorage();
                    loadFiltersFromStorageForAttributes();
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
            console.log("Component unmounted. Cleaning up...");
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", stopResize);
        };
    });

    // ******************************* handle sorting *******************************************//

    let columnSortStates: {
        [key: string]: { direction: boolean; active: boolean };
    } = {};
    let selectedAttributeForSorting: string = "";
    let selectedSortingOrder: string = "";

    // Replace your handleSorting function with this updated version
    const handleSorting = (attributeName: string) => {
        // Initialize or toggle sort state for the clicked column
        if (!columnSortStates[attributeName]) {
            columnSortStates[attributeName] = { direction: true, active: true };
        } else {
            columnSortStates[attributeName].direction =
                !columnSortStates[attributeName].direction;
        }

        // Reset other columns' active state
        Object.keys(columnSortStates).forEach((key) => {
            if (key !== attributeName) {
                columnSortStates[key] = {
                    ...columnSortStates[key],
                    active: false,
                };
            }
        });

        columnSortStates[attributeName].active = true;
        selectedSortingOrder = columnSortStates[attributeName].direction
            ? "asc"
            : "desc";
        selectedAttributeForSorting = attributeName;

        let nextoffset = 0;
        const localEntityOffset = localStorage.getItem("entityNextOffset");
        if (localEntityOffset) {
            let parseData =
                localEntityOffset &&
                localEntityOffset !== "{}" &&
                JSON.parse(localEntityOffset)[entityName] !== undefined
                    ? JSON.parse(localEntityOffset)[entityName]
                    : {};
            nextoffset = parseData;
        }

        let localFilterByValues = localStorage.getItem("filterByValues");
        let parseData =
            localFilterByValues &&
            localFilterByValues !== "{}" &&
            JSON.parse(localFilterByValues)[entityName] !== undefined
                ? JSON.parse(localFilterByValues)[entityName]
                : {};

        fetchEntities(
            5,
            nextoffset,
            "",
            [],
            attributeName,
            selectedSortingOrder,
            parseData,
        );
    };

    // ****************************************************************************************//

    //**************************** drag and drop feature **************************************//

    let draggedColumn: string | null = null;
    let dragOverColumn: string | null = null;
    let columnOrder = writable<string[]>([]);

    $: {
        if (
            $attributes &&
            $attributes.length > 0 &&
            $columnOrder.length === 0
        ) {
            const localFilterByAttributes =
                localStorage.getItem("filterByAttributes");

            if (
                localFilterByAttributes &&
                JSON.parse(localFilterByAttributes)[entityName]?.length > 0
            ) {
                let existingFilterByAttributes = localFilterByAttributes
                    ? JSON.parse(localFilterByAttributes)[entityName]
                    : {};
                const filteredOrder = existingFilterByAttributes?.filter(
                    (attrName: any) =>
                        $attributes.some((attr) => attr.name === attrName),
                );
                columnOrder.set(filteredOrder);
            } else {
                columnOrder.set($attributes.map((attr) => attr.name));
            }
        }
    }

    function handleDragStart(event: DragEvent, column: string) {
        if (!event.dataTransfer) return;
        draggedColumn = column;
        event.dataTransfer.effectAllowed = "move";
    }

    function handleDragOver(event: DragEvent, column: string) {
        event.preventDefault();
        if (column !== draggedColumn) {
            dragOverColumn = column;
        }
    }

    function handleDragLeave() {
        dragOverColumn = null;
    }

    function handleDrop(event: DragEvent, targetColumn: string) {
        event.preventDefault();
        if (!draggedColumn || draggedColumn === targetColumn) {
            draggedColumn = null;
            dragOverColumn = null;
            return;
        }

        const currentColumns = [...$columnOrder];
        const draggedIdx = currentColumns.indexOf(draggedColumn);
        const targetIdx = currentColumns.indexOf(targetColumn);

        currentColumns.splice(draggedIdx, 1);
        currentColumns.splice(targetIdx, 0, draggedColumn);

        columnOrder.set(currentColumns);
        draggedColumn = null;
        dragOverColumn = null;
    }

    function handleDragEnd() {
        draggedColumn = null;
        dragOverColumn = null;
    }

    //********************************************************************************************//

    //************************************ Resizing columns **************************************//

    let currentColumnIndex: number | null = null;
    let startX: number;
    let startWidth: number;
    let columnWidths = writable<{ [key: string]: number }>({});
    let isResizing = false;

    // $: if ($attributes?.length > 0 && $columnOrder.length === 0) {
    //     columnOrder.set($attributes.map((attr) => attr.name));
    // }

    $: if ($attributes?.length > 0) {
        columnWidths.update((widths) => {
            const newWidths = { ...widths };
            $attributes.forEach((attr) => {
                if (!newWidths[attr.name]) {
                    const width =
                        attr.data_type === "id"
                            ? 200
                            : attr.data_type === "text"
                              ? 200
                              : attr.data_type === "date"
                                ? 200
                                : 200;
                    newWidths[attr.name] = width;
                }
            });
            return newWidths;
        });
    }

    function startResize(columnName: string, event: MouseEvent) {
        event.preventDefault();
        currentColumnIndex = $columnOrder.indexOf(columnName);
        startX = event.pageX;
        startWidth = $columnWidths[columnName] || 150;
        isResizing = true;

        document.body.classList.add("select-none");
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", stopResize);
    }

    function handleMouseMove(event: MouseEvent) {
        if (!isResizing || currentColumnIndex === null) return;
        const columnName = $columnOrder[currentColumnIndex];
        const diff = event.pageX - startX;
        const newWidth = Math.max(100, startWidth + diff);

        columnWidths.update((widths) => ({
            ...widths,
            [columnName]: newWidth,
        }));
    }

    function stopResize() {
        isResizing = false;
        currentColumnIndex = null;
        document.body.classList.remove("select-none");
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", stopResize);
    }

    //*******************************************************************************************//
</script>

{#if $isConnected}
    <div class="max-w-[95%] mx-auto mt-10 font-sans text-sm p-5">
        <div class="flex justify-end items-center font-sans">
            <div class="flex gap-4 font-poppins text-sm">
                <button
                    class="bg-[#34495E] text-white px-4 py-2 rounded-lg shadow transition-all"
                    on:click={() => {
                        isFilterModalOpen = true;
                    }}
                >
                    <div class=" flex flex-row items-center space-x-3 p-1">
                        <img src={filter} alt="filter" class=" h-5" />
                        <span> Filter </span>
                    </div>
                </button>
                <button
                    class="bg-[#00B894] text-white px-4 py-2 rounded-lg shadow transition-all"
                    on:click={() => {
                        isAddModalOpen = true;
                    }}
                >
                    Add {entityName}
                </button>
            </div>
        </div>

        {#if $filterStoreForAttributes.visible && $filterStoreForAttributes.values[entityName] != null}
            <div class="px-2 py-4">
                <div>
                    <div class=" flex flex-row items-center space-x-4">
                        <h3
                            class={`${$filterStoreForAttributes.values[entityName] == undefined ? "hidden" : ""}  text-sm font-medium text-[#34495E] mb-3 ml-1`}
                        >
                            SELECTED ATTRIBUTES
                        </h3>
                    </div>
                    <div class="flex flex-wrap items-center gap-3">
                        {#each Object.entries($filterStoreForAttributes.values[entityName] || {}) as [key, values]}
                            {#if values && values.length > 0}
                                <div
                                    class="flex items-center bg-slate-100 text-slate-700 rounded-full px-4 py-2 transition-all hover:bg-slate-200 group"
                                >
                                    <span class="ml-1 text-sm">
                                        {values}
                                    </span>
                                    <button
                                        class="ml-2 p-1 rounded-full hover:bg-slate-300 transition-colors"
                                        on:click={() =>
                                            filterActionsForAttibutes.removeFilter(
                                                entityName,
                                                values,
                                                columnOrder,
                                                $attributes,
                                                fetchEntities,
                                            )}
                                    >
                                        <X class="w-3 h-3 text-slate-600" />
                                    </button>
                                </div>
                            {/if}
                        {/each}
                    </div>
                </div>
            </div>
        {/if}

        <div class="relative px-2 mb-3">
            <div class="flex items-center gap-2">
                <button
                    on:click={() => {
                        filterActionsForAttibutes.clearEntityFilters(
                            entityName,
                            columnOrder,
                            $attributes,
                            fetchEntities,
                        );
                    }}
                    class={`${JSON.stringify($filterStoreForAttributes.values[entityName]) == "[]" || $filterStoreForAttributes.values[entityName] == undefined ? "hidden" : ""} px-4 py-2 text-sm font-medium text-red-600 bg-red-100 rounded-full hover:bg-red-200 transition-colors`}
                >
                    Clear All Attribute filter
                </button>

                <div class="relative">
                    <div class=" flex flex-col items-start">
                        <span
                            class={`text-sm p-2 font-medium ${JSON.stringify($filterStoreForAttributes.values[entityName]) == "[]" || $filterStoreForAttributes.values[entityName] == undefined ? "" : "hidden"}`}
                            >ADD FILTER ATTRIBUTES</span
                        >
                        <button
                            on:click={() =>
                                (isColumnModalOpen = !isColumnModalOpen)}
                            class="flex items-center justify-center w-10 h-10 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
                            aria-label="Add new filter"
                        >
                            <Plus class="w-5 h-5 text-slate-600" />
                        </button>
                    </div>
                    {#if isColumnModalOpen}
                        <div class="absolute z-50 mt-2 top-full">
                            <ColumnModal
                                {entityName}
                                bind:isColumnModalOpen
                                bind:columnOrder
                                {fetchEntities}
                            />
                        </div>
                    {/if}
                </div>
            </div>
        </div>
        {#if $filterStore.visible && (JSON.stringify($filterStore.values[entityName]) != "{}" || $filterStore.values[entityName] != null)}
            <div class="px-2 py-4">
                <div>
                    <div class=" flex flex-row items-center space-x-4">
                        <h3
                            class={`${JSON.stringify($filterStore.values[entityName]) == "{}" || $filterStore.values[entityName] == undefined ? "hidden" : ""} text-sm font-medium text-[#34495E] mb-3 ml-1`}
                        >
                            SELECT FILTERS
                        </h3>
                    </div>
                    <div class="flex flex-wrap items-center gap-3">
                        {#each Object.entries($filterStore.values[entityName] || {}) as [field, values]}
                            {#if values && values.length > 0}
                                {#each values as value}
                                    <div
                                        class="flex items-center bg-slate-100 text-slate-700 rounded-full px-4 py-2 transition-all hover:bg-slate-200 group"
                                    >
                                        <span class="font-medium text-sm">
                                            {formatLabel(field)}:
                                        </span>
                                        <span class="ml-1 text-sm">
                                            {value}
                                        </span>
                                        <button
                                            class="ml-2 p-1 rounded-full hover:bg-slate-300 transition-colors"
                                            aria-label="Remove {formatLabel(
                                                field,
                                            )} filter for {value}"
                                            on:click={() =>
                                                filterActions.removeFilter(
                                                    entityName,
                                                    field,
                                                    value,
                                                    fetchEntities,
                                                )}
                                        >
                                            <X class="w-3 h-3 text-slate-600" />
                                        </button>
                                    </div>
                                {/each}
                            {/if}
                        {/each}
                    </div>
                </div>
            </div>
        {/if}

        <div class="relative px-2 mb-3">
            <div class="flex items-center gap-2">
                <button
                    on:click={() => {
                        filterActions.clearEntityFilters(entityName);
                        fetchEntities(5, 0, "", [], "", "", []);
                    }}
                    class={`${JSON.stringify($filterStore.values[entityName]) == "{}" || $filterStore.values[entityName] == undefined ? "hidden" : ""} px-4 py-2 text-sm font-medium text-red-600 bg-red-100 rounded-full hover:bg-red-200 transition-colors`}
                >
                    Clear All Filters
                </button>

                <div class="relative">
                    <div class=" flex flex-col items-start">
                        <span
                            class={`text-sm p-2 font-medium ${JSON.stringify($filterStore.values[entityName]) == "{}" || $filterStore.values[entityName] == undefined ? "" : "hidden"}`}
                            >ADD FILTER</span
                        >
                        <button
                            on:click={() =>
                                (isSingleFilterModalOpen =
                                    !isSingleFilterModalOpen)}
                            class="flex items-center justify-center w-10 h-10 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
                            aria-label="Add new filter"
                        >
                            <Plus class="w-5 h-5 text-slate-600" />
                        </button>
                    </div>
                    {#if isSingleFilterModalOpen}
                        <div class="absolute z-50 mt-2 top-full">
                            <SingleFilterModal
                                bind:isOpen={isSingleFilterModalOpen}
                                {entityName}
                                {fetchEntities}
                            />
                        </div>
                    {/if}
                </div>
            </div>
        </div>

        <div
            class="overflow-x-auto h-[350px] scrollbar-beautiful rounded-lg shadow-md relative"
        >
            <table
                class="table-auto w-full text-sm border text-gray-700 bg-white"
                style="border-collapse: collapse;"
            >
                <thead class="sticky top-0 bg-gray-50">
                    <tr>
                        <th class="py-4 px-4 text-start font-semibold w-[90px]">
                            ACTIONS
                        </th>
                        {#each $columnOrder as columnName}
                            <th
                                draggable={true}
                                on:dragstart={(e) =>
                                    handleDragStart(e, columnName)}
                                on:dragover={(e) =>
                                    handleDragOver(e, columnName)}
                                on:dragleave={handleDragLeave}
                                on:drop={(e) => handleDrop(e, columnName)}
                                on:dragend={handleDragEnd}
                                style="width: {$columnWidths[
                                    columnName
                                ]}px; min-width: {$columnWidths[columnName]}px"
                                class="relative py-4 px-3 text-left font-semibold select-none transition-all duration-200 ease-in-out column-header
                                {draggedColumn === columnName
                                    ? 'bg-blue-100'
                                    : 'hover:bg-gray-200'}
                                {dragOverColumn === columnName
                                    ? 'bg-blue-50'
                                    : ''}
                                {isResizing
                                    ? 'select-none'
                                    : 'cursor-grab active:cursor-grabbing'}"
                            >
                                <div class="flex flex-row items-center gap-2">
                                    <span>
                                        {columnName
                                            .replace(/_/g, " ")
                                            .toUpperCase()}
                                    </span>
                                    <button
                                        on:click={() =>
                                            handleSorting(columnName)}
                                        class="focus:outline-none"
                                    >
                                        <img
                                            src={columnSortStates[columnName]
                                                ?.active
                                                ? columnSortStates[columnName]
                                                      ?.direction
                                                    ? upArrow
                                                    : downArrow
                                                : sortingArrows}
                                            alt="sort"
                                            class="h-5 hover:cursor-pointer p-1"
                                        />
                                    </button>
                                </div>
                                <div
                                    class="resize-handle"
                                    class:active={isResizing &&
                                        currentColumnIndex ===
                                            $columnOrder.indexOf(columnName)}
                                    on:mousedown={(e) =>
                                        startResize(columnName, e)}
                                    role="button"
                                    tabindex="0"
                                    aria-label="Resize column"
                                ></div>
                            </th>
                        {/each}
                    </tr>
                </thead>
                <tbody>
                    {#if $entitiesData === undefined || $entitiesData === null}
                        <tr>
                            <td colspan={100} class="text-center py-8">
                                No data available
                            </td>
                        </tr>
                    {:else if $entitiesData.length > 0}
                        {#each $entitiesData as entity}
                            <tr
                                class="bg-white even:bg-gray-50 hover:bg-gray-200 duration-150"
                            >
                                <td
                                    class="py-3 px-2"
                                    style="min-width:120px; white-space:nowrap;"
                                >
                                    <div
                                        class="flex items-center justify-start space-x-7 ml-1"
                                    >
                                        <button
                                            type="button"
                                            class="text-blue-500 hover:text-blue-700 transition duration-150 ease-in-out"
                                            on:click={() =>
                                                openEditModal(entity)}
                                        >
                                            <img
                                                src={edit}
                                                alt="Edit"
                                                class="h-5 inline"
                                            />
                                        </button>
                                        <button
                                            type="button"
                                            class="text-red-500 hover:text-red-700 transition duration-150 ease-in-out"
                                            on:click={() =>
                                                openDeleteModal(entity)}
                                        >
                                            <img
                                                src={deleteButton}
                                                alt="Delete"
                                                class="h-5 inline"
                                            />
                                        </button>
                                    </div>
                                </td>
                                {#each $columnOrder as columnName}
                                    <td
                                        class="py-3 px-4 text-sm whitespace-nowrap hover:cursor-pointer"
                                        style="width: {$columnWidths[
                                            columnName
                                        ]}px; min-width: {columnName.length +
                                            150}px"
                                        on:click={() =>
                                            openViewDetailsModal(entity)}
                                    >
                                        {#if typeof entity[columnName] === "object" && entity[columnName] !== null}
                                            {#if columnName === entity_address}
                                                {#each ["line", "city", "state", "country", "zip"] as key, i}
                                                    {#if entity[columnName]?.[key]}
                                                        {" " +
                                                            entity[columnName][
                                                                key
                                                            ]}{#if i < 4},{/if}
                                                    {/if}
                                                {/each}
                                            {:else}
                                                {JSON.stringify(
                                                    entity[columnName],
                                                )}
                                            {/if}
                                        {:else}
                                            {entity[columnName]}
                                        {/if}
                                    </td>
                                {/each}
                            </tr>
                        {/each}
                    {:else}
                        <tr>
                            <td class="">
                                <Loader show={true} />
                            </td>
                        </tr>
                    {/if}
                </tbody>
            </table>
        </div>

        <Pagination
            {entityName}
            bind:selectedAttributeForSorting
            bind:selectedSortingOrder
        />
    </div>
{:else}
    <p>Connecting to the server, please wait...</p>
{/if}

{#if isAddModalOpen}
    <AddModal
        {entityName}
        bind:isAddModalOpen
        bind:selectedAttributeForSorting
        bind:selectedSortingOrder
    />
{/if}

{#if isDeleteModalOpen}
    <DeleteModal {entityName} bind:isDeleteModalOpen {selectedEntityId} />
{/if}

{#if isEditModalOpen && selectedEntity}
    <EditModal
        {selectedEntity}
        bind:isEditModalOpen
        {selectedPrimaryKeyName}
        {entityName}
        {selectedEntityId}
    />
{/if}

{#if isViewDetailsModalOpen}
    <ViewModal bind:isViewDetailsModalOpen {entityName} {detailedEntity} />
{/if}

{#if isFilterModalOpen}
    <FilterModal bind:isFilterModalOpen {entityName} bind:columnOrder />
{/if}

<style>
    th,
    td {
        border-color: #d1d5db;
    }

    .resize-handle {
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        cursor: col-resize;
        background-color: transparent;
        transition: background-color 0.2s;
    }

    .resize-handle:hover,
    .resize-handle.active {
        background-color: #4299e1;
    }

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

    .column-header {
        transition:
            background-color 0.2s,
            transform 0.1s;
    }

    .column-header:hover {
        background-color: rgba(0, 0, 0, 0.05);
    }

    .select-none {
        user-select: none;
    }

    td {
        max-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
</style>
