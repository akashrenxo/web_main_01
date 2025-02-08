<script lang="ts">
    import { writable } from "svelte/store";
    import { onMount } from "svelte";
    import { entityStore } from "$lib/stores/apiStores/entityStores";
    import {
        filterStore,
        filterStoreForAttributes,
    } from "$lib/stores/filterStore";
    export let entityName: string;
    export let isColumnModalOpen: boolean;
    export let columnOrder: any;
    export let fetchEntities: any;

    const { attributes, isConnected, fetchEntityAttributes } =
        entityStore(entityName);

    interface AttributesWithSelectOption {
        name: string;
        selected: boolean;
    }

    const attributesWithSelectOption = writable<AttributesWithSelectOption[]>(
        [],
    );
    const selectAllChecked = writable<boolean>(true);

    $: if ($attributes.length && !$attributesWithSelectOption.length) {
        attributesWithSelectOption.set(
            $attributes.map((attr) => ({
                name: attr.name,
                selected: true,
            })),
        );
    }

    onMount(() => {
        const fetchData = async () => {
            if ($isConnected) {
                try {
                    await fetchEntityAttributes();
                } catch (error) {
                    console.error("Error fetching data:", error);
                }
            }
        };
        fetchData();
        return () => console.log("Component unmounted. Cleaning up...");
    });

    $: {
        if ($attributes.length && !$attributesWithSelectOption.length) {
            attributesWithSelectOption.set(
                $attributes.map((attr) => ({
                    name: attr.name,
                    selected: true,
                })),
            );
        }
    }

    const toggleSelectAllOption = () => {
        const newState = !$selectAllChecked;
        selectAllChecked.set(newState);
        attributesWithSelectOption.update((attrs) =>
            attrs.map((attr) => ({ ...attr, selected: newState })),
        );
    };

    const toggleAttributeCheckbox = (name: string) => {
        attributesWithSelectOption.update((attrs) =>
            attrs.map((attr) =>
                attr.name === name
                    ? { ...attr, selected: !attr.selected }
                    : attr,
            ),
        );
        selectAllChecked.set(
            $attributesWithSelectOption.every((attr) => attr.selected),
        );
    };

    let hasInitialized = false;

    $: {
        if ($attributes.length && !hasInitialized) {
            hasInitialized = true;
            const localFilterByAttributes =
                localStorage.getItem("filterByAttributes");

            if (localFilterByAttributes) {
                let existingFilterByAttributes = localFilterByAttributes
                    ? JSON.parse(localFilterByAttributes)
                    : {};
                if (existingFilterByAttributes[entityName]) {
                    attributesWithSelectOption.set(
                        $attributes.map((attr) => ({
                            name: attr.name,
                            selected: existingFilterByAttributes[
                                entityName
                            ].includes(attr.name),
                        })),
                    );
                    selectAllChecked.set(
                        $attributesWithSelectOption.every(
                            (attr) => attr.selected,
                        ),
                    );
                }
            } else {
                attributesWithSelectOption.set(
                    $attributes.map((attr) => ({
                        name: attr.name,
                        selected: true,
                    })),
                );
            }
        }
    }

    const handleFilterApply = () => {
        const arrayOfselectedAttributes = $attributesWithSelectOption
            .filter((attr) => attr.selected)
            .map((attr) => attr.name);

        const localFilterByAttributes =
            localStorage.getItem("filterByAttributes");
        let existingFilterByAttributes = localFilterByAttributes
            ? JSON.parse(localFilterByAttributes)
            : {};

        existingFilterByAttributes = {
            ...existingFilterByAttributes,
            [entityName]: arrayOfselectedAttributes,
        };

        localStorage.setItem(
            "filterByAttributes",
            JSON.stringify(existingFilterByAttributes),
        );

        filterStoreForAttributes.update((state) => ({
            values: existingFilterByAttributes,
            visible: existingFilterByAttributes[entityName].length > 0,
        }));

        let localFilterByValues = localStorage.getItem("filterByValues");

        let parseData =
            localFilterByValues &&
            localFilterByValues != "{}" &&
            JSON.parse(localFilterByValues)[entityName] != undefined
                ? JSON.parse(localFilterByValues)[entityName]
                : {};
        console.log("hi eerybody", parseData);
        columnOrder.set(arrayOfselectedAttributes);
        fetchEntities(5, 0, "", arrayOfselectedAttributes, "", "", parseData);
        isColumnModalOpen = false;
    };
</script>

<div
    class="absolute top-0 w-[200px] bg-white rounded-lg shadow-lg border border-slate-200 p-4 z-50 max-h-[300px] overflow-y-auto scrollbar-hidden font-poppins"
>
    <div class="flex justify-end items-center mb-4">
        <button
            type="button"
            aria-label="Close"
            class="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded"
            on:click={() => {
                isColumnModalOpen = !isColumnModalOpen;
            }}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
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
    <div class="col-span-2">
        <div class="flex gap-2 text-sm font-medium items-center my-3">
            <input
                type="checkbox"
                checked={$selectAllChecked}
                on:change={toggleSelectAllOption}
                class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 hover:cursor-pointer"
            />
            <span class="font-medium">Select All</span>
        </div>

        {#each $attributesWithSelectOption as attr}
            <div
                class="flex flex-row gap-2 text-sm font-medium items-center mb-2"
            >
                <input
                    type="checkbox"
                    checked={attr.selected}
                    on:change={() => toggleAttributeCheckbox(attr.name)}
                    class="h-4 w-4 text-[#344] border-gray-300 rounded focus:ring-blue-500 hover:cursor-pointer"
                />
                <span>{attr.name.replace(/_/g, " ")}</span>
            </div>
        {/each}
    </div>
    <div class=" flex justify-end text-xs mt-3">
        <button
            type="submit"
            class="px-3 py-2 bg-[#00B894] text-white rounded-lg hover:bg-[#008B72] transition duration-150 ease-in-out"
            on:click={handleFilterApply}
        >
            Add Filter
        </button>
    </div>
</div>

<style>
    .scrollbar-hidden::-webkit-scrollbar {
        display: none;
    }

    .scrollbar-hidden {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
</style>
