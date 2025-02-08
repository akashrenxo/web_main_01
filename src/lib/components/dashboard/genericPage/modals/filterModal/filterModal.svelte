<script lang="ts">
    import { writable } from "svelte/store";
    import { entityStore } from "$lib/stores/apiStores/entityStores";
    import countryList from "$lib/components/dashboard/countryList/countryList.json";
    import { onMount } from "svelte";
    import {
        filterStore,
        filterStoreForAttributes,
    } from "$lib/stores/filterStore";

    export let isFilterModalOpen: boolean;
    export let entityName: string;
    export let columnOrder: any;

    const { fetchEntities, attributes, isConnected, fetchEntityAttributes } =
        entityStore(entityName);

    interface Filters {
        [key: string]: string[];
    }

    interface FilterData {
        [entityName: string]: Filters;
    }

    interface Country {
        name: string;
        states: string[];
    }

    let attributeInputValues: Filters = {};
    let temporaryInputOfAttribute: {
        [key: string]: string | boolean | number;
    } = {};
    const countries: Country[] = countryList.countries;

    let addressFields = {
        line: "",
        city: "",
        zipCode: "",
        country: "",
        state: "",
    };
    let states: string[] = [];

    const loadStoredFilters = (): void => {
        try {
            const storedData = localStorage.getItem("filterByValues");
            if (storedData) {
                const parsedData: FilterData = JSON.parse(storedData);
                if (parsedData[entityName]) {
                    attributeInputValues = parsedData[entityName];
                }
            }
        } catch (error) {
            console.error("Error loading stored filters:", error);
            attributeInputValues = {};
        }
    };

    onMount(() => {
        const fetchData = async () => {
            if ($isConnected) {
                try {
                    await fetchEntityAttributes();
                    console.log("Data fetched successfully");
                    await loadStoredFilters();
                } catch (error) {
                    console.error("Error fetching data:", error);
                }
            }
        };
        fetchData();
        return () => console.log("Component unmounted. Cleaning up...");
    });

    $: sortedAttributes = [...$attributes].sort((a, b) =>
        a.name === "name" ? -1 : b.name === "name" ? 1 : 0,
    );

    $: states = addressFields.country
        ? countries.find((country) => country.name === addressFields.country)
              ?.states || []
        : [];

    const handleCountryChange = (event: any) => {
        const selectedCountry = event.target.value;
        temporaryInputOfAttribute["country"] = selectedCountry;
        addressFields.country = selectedCountry;
    };

    // ********************************** manage filter by attributes **********************************//

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

    // ********************************************************************************************************//

    // ********************************** manage filter values of attributes **********************************//

    const addInputValueOfAttribute = (attribute: string): void => {
        let value: string;
        const inputValue = temporaryInputOfAttribute[attribute];

        if (typeof inputValue === "string") {
            value = inputValue.trim();
        } else if (typeof inputValue === "boolean") {
            value = inputValue ? "Yes" : "No";
        } else if (typeof inputValue === "number") {
            value = inputValue.toString();
        } else {
            return;
        }

        if (
            value &&
            (!attributeInputValues[attribute] ||
                !attributeInputValues[attribute].includes(value))
        ) {
            attributeInputValues = {
                ...attributeInputValues,
                [attribute]: [
                    ...(attributeInputValues[attribute] || []),
                    value,
                ],
            };
            temporaryInputOfAttribute[attribute] = "";
        }
    };

    const removeInputValueOfAttribute = (
        attribute: string,
        value: string,
    ): void => {
        if (attributeInputValues[attribute]) {
            attributeInputValues = {
                ...attributeInputValues,
                [attribute]: attributeInputValues[attribute].filter(
                    (v) => v !== value,
                ),
            };
        }
    };

    // ********************************************************************************************************//

    const handleApplyFilters = (attributeInputValues: any) => {
        // ************** handle filter by values *****************//

        const localFilterByValue = localStorage.getItem("filterByValues");

        let existingFilterData = localFilterByValue
            ? JSON.parse(localFilterByValue)
            : {};

        const hasValues = Object.values(attributeInputValues).some(
            (arr) => Array.isArray(arr) && arr.length > 0,
        );

        attributeInputValues = hasValues ? attributeInputValues : {};

        existingFilterData = {
            ...existingFilterData,
            [entityName]: attributeInputValues,
        };

        localStorage.setItem(
            "filterByValues",
            JSON.stringify(existingFilterData),
        );

        console.log("filter by values", existingFilterData[entityName]);

        filterStore.update((state) => ({
            values: existingFilterData,
            visible: Object.values(existingFilterData).some((entityFilters) =>
                Object.values(entityFilters as object).some(
                    (values) => Array.isArray(values) && values.length > 0,
                ),
            ),
        }));
        console.log("attributeInputValues", attributeInputValues);
        // **********  handle filter by attributes *************//

        console.log("attributesWithSelectOption", $attributesWithSelectOption);

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

        columnOrder.set(arrayOfselectedAttributes);

        console.log("arrayOfselectedAttributes", arrayOfselectedAttributes);
        fetchEntities(
            5,
            0,
            "",
            arrayOfselectedAttributes,
            "",
            "",
            attributeInputValues,
        );
        isFilterModalOpen = false;
    };
</script>

<div
    class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 font-poppins"
>
    <div
        class="bg-white rounded-lg shadow-lg p-6 max-w-3xl w-full max-h-[550px] overflow-y-auto scrollbar-hidden grid grid-cols-6"
    >
        <div class="col-span-2">
            <h2 class="text-sm font-semibold">Filter by Attributes</h2>
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

        <div class="col-span-4">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-sm font-semibold">Filter by Value</h2>
                <button
                    class="text-gray-500 hover:text-gray-700 focus:outline-none"
                    on:click={() => (isFilterModalOpen = false)}
                >
                    ✕
                </button>
            </div>

            <div class="space-y-3 text-sm">
                {#each sortedAttributes as attr}
                    <div>
                        <label
                            for="filter-{attr}"
                            class="block text-sm font-medium text-gray-700"
                        >
                            {attr.name.replace(/_/g, " ")}
                        </label>

                        <div class="flex flex-wrap gap-2">
                            {#each attributeInputValues[attr.name] || [] as value}
                                <span
                                    class="bg-blue-100 text-[#34495E] px-2 py-1 rounded flex items-center gap-2"
                                >
                                    {value}
                                    <button
                                        class="text-[#34495E]"
                                        on:click={() =>
                                            removeInputValueOfAttribute(
                                                attr.name,
                                                value,
                                            )}
                                    >
                                        ✕
                                    </button>
                                </span>
                            {/each}
                        </div>
                        <div class="flex gap-2 mt-2">
                            {#if attr.data_type === "toggle"}
                                <select
                                    id={attr.name}
                                    bind:value={temporaryInputOfAttribute[
                                        attr.name
                                    ]}
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#34495E]"
                                >
                                    <option value="" disabled selected
                                        >Select an option</option
                                    >
                                    <option value={true}>Yes</option>
                                    <option value={false}>No</option>
                                </select>
                            {:else if attr.data_type === "address"}
                                <div class="space-y-2 w-full">
                                    <div>
                                        <div class="flex flex-wrap gap-2">
                                            {#each attributeInputValues["line"] || [] as value}
                                                <span
                                                    class="bg-blue-100 text-[#34495E] px-2 py-1 rounded flex items-center gap-2"
                                                >
                                                    {value}
                                                    <button
                                                        class="text-[#34495E]"
                                                        on:click={() =>
                                                            removeInputValueOfAttribute(
                                                                "line",
                                                                value,
                                                            )}
                                                    >
                                                        ✕
                                                    </button>
                                                </span>
                                            {/each}
                                        </div>
                                        <div
                                            class=" flex flex-row gap-x-2 mt-2"
                                        >
                                            <input
                                                type="text"
                                                placeholder="Line"
                                                bind:value={temporaryInputOfAttribute[
                                                    "line"
                                                ]}
                                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#34495E]"
                                            />
                                            <button
                                                class="bg-[#34495E] text-white px-4 rounded-md text-sm h-8"
                                                on:click={() =>
                                                    addInputValueOfAttribute(
                                                        "line",
                                                    )}
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                    <!-- <div>
                                        <div class="flex flex-wrap gap-2">
                                            {#each attributeInputValues["line2"] || [] as value}
                                                <span
                                                    class="bg-blue-100 text-[#34495E] px-2 py-1 rounded flex items-center gap-2"
                                                >
                                                    {value}
                                                    <button
                                                        class="text-[#34495E]"
                                                        on:click={() =>
                                                            removeInputValueOfAttribute(
                                                                "line2",
                                                                value,
                                                            )}
                                                    >
                                                        ✕
                                                    </button>
                                                </span>
                                            {/each}
                                        </div>
                                        <div
                                            class=" flex flex-row gap-x-2 mt-2"
                                        >
                                            <input
                                                type="text"
                                                placeholder="Line 2"
                                                bind:value={temporaryInputOfAttribute[
                                                    "line2"
                                                ]}
                                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#34495E]"
                                            />
                                            <button
                                                class="bg-[#34495E] text-white px-4 rounded-md text-sm h-8"
                                                on:click={() =>
                                                    addInputValueOfAttribute(
                                                        "line2",
                                                    )}
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <div class="flex flex-wrap gap-2">
                                            {#each attributeInputValues["line3"] || [] as value}
                                                <span
                                                    class="bg-blue-100 text-[#34495E] px-2 py-1 rounded flex items-center gap-2"
                                                >
                                                    {value}
                                                    <button
                                                        class="text-[#34495E]"
                                                        on:click={() =>
                                                            removeInputValueOfAttribute(
                                                                "line3",
                                                                value,
                                                            )}
                                                    >
                                                        ✕
                                                    </button>
                                                </span>
                                            {/each}
                                        </div>
                                        <div
                                            class=" flex flex-row gap-x-2 mt-2"
                                        >
                                            <input
                                                type="text"
                                                placeholder="Line 3"
                                                bind:value={temporaryInputOfAttribute[
                                                    "line3"
                                                ]}
                                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#34495E]"
                                            />
                                            <button
                                                class="bg-[#34495E] text-white px-4 rounded-md text-sm h-8"
                                                on:click={() =>
                                                    addInputValueOfAttribute(
                                                        "line3",
                                                    )}
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div> -->
                                    <div>
                                        <div class="flex flex-wrap gap-2">
                                            {#each attributeInputValues["city"] || [] as value}
                                                <span
                                                    class="bg-blue-100 text-[#34495E] px-2 py-1 rounded flex items-center gap-2"
                                                >
                                                    {value}
                                                    <button
                                                        class="text-[#34495E]"
                                                        on:click={() =>
                                                            removeInputValueOfAttribute(
                                                                "city",
                                                                value,
                                                            )}
                                                    >
                                                        ✕
                                                    </button>
                                                </span>
                                            {/each}
                                        </div>
                                        <div
                                            class=" flex flex-row gap-x-2 mt-2"
                                        >
                                            <input
                                                type="text"
                                                placeholder="City"
                                                bind:value={temporaryInputOfAttribute[
                                                    "city"
                                                ]}
                                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#34495E]"
                                            />
                                            <button
                                                class="bg-[#34495E] text-white px-4 rounded-md text-sm h-8"
                                                on:click={() =>
                                                    addInputValueOfAttribute(
                                                        "city",
                                                    )}
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <div class="flex flex-wrap gap-2">
                                            {#each attributeInputValues["zip"] || [] as value}
                                                <span
                                                    class="bg-blue-100 text-[#34495E] px-2 py-1 rounded flex items-center gap-2"
                                                >
                                                    {value}
                                                    <button
                                                        class="text-[#34495E]"
                                                        on:click={() =>
                                                            removeInputValueOfAttribute(
                                                                "zip",
                                                                value,
                                                            )}
                                                    >
                                                        ✕
                                                    </button>
                                                </span>
                                            {/each}
                                        </div>
                                        <div
                                            class=" flex flex-row gap-x-2 mt-2"
                                        >
                                            <input
                                                type="text"
                                                placeholder="Zip Code"
                                                bind:value={temporaryInputOfAttribute[
                                                    "zip"
                                                ]}
                                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#34495E]"
                                            />
                                            <button
                                                class="bg-[#34495E] text-white px-4 rounded-md text-sm h-8"
                                                on:click={() =>
                                                    addInputValueOfAttribute(
                                                        "zip",
                                                    )}
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <div class="flex flex-wrap gap-2">
                                            {#each attributeInputValues["country"] || [] as value}
                                                <span
                                                    class="bg-blue-100 text-[#34495E] px-2 py-1 rounded flex items-center gap-2"
                                                >
                                                    {value}
                                                    <button
                                                        class="text-[#34495E]"
                                                        on:click={() =>
                                                            removeInputValueOfAttribute(
                                                                "country",
                                                                value,
                                                            )}
                                                    >
                                                        ✕
                                                    </button>
                                                </span>
                                            {/each}
                                        </div>
                                        <div
                                            class=" flex flex-row gap-x-2 mt-2"
                                        >
                                            <select
                                                bind:value={temporaryInputOfAttribute[
                                                    "country"
                                                ]}
                                                on:change={handleCountryChange}
                                                class="w-full p-2 border rounded-lg shadow-sm mb"
                                            >
                                                <option
                                                    value=""
                                                    disabled
                                                    selected
                                                    >Select Country</option
                                                >
                                                {#each countries as country}
                                                    <option value={country.name}
                                                        >{country.name}</option
                                                    >
                                                {/each}
                                            </select>

                                            <button
                                                class="bg-[#34495E] text-white px-4 rounded-md text-sm h-8"
                                                on:click={() =>
                                                    addInputValueOfAttribute(
                                                        "country",
                                                    )}
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <div class="flex flex-wrap gap-2">
                                            {#each attributeInputValues["state"] || [] as value}
                                                <span
                                                    class="bg-blue-100 text-[#34495E] px-2 py-1 rounded flex items-center gap-2"
                                                >
                                                    {value}
                                                    <button
                                                        class="text-[#34495E]"
                                                        on:click={() =>
                                                            removeInputValueOfAttribute(
                                                                "state",
                                                                value,
                                                            )}
                                                    >
                                                        ✕
                                                    </button>
                                                </span>
                                            {/each}
                                        </div>
                                        <div
                                            class=" flex flex-row gap-x-2 mt-2"
                                        >
                                            <select
                                                disabled={!states.length}
                                                bind:value={temporaryInputOfAttribute[
                                                    "state"
                                                ]}
                                                class="w-full p-2 border rounded-lg shadow-sm"
                                            >
                                                <option value="">
                                                    {states.length
                                                        ? "Select State"
                                                        : "No states available"}
                                                </option>
                                                {#each states as state}
                                                    <option value={state}
                                                        >{state}</option
                                                    >
                                                {/each}
                                            </select>
                                            <button
                                                class="bg-[#34495E] text-white px-4 rounded-md text-sm h-8"
                                                on:click={() =>
                                                    addInputValueOfAttribute(
                                                        "state",
                                                    )}
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            {:else}
                                <input
                                    id={attr.name}
                                    type={attr.data_type === "number"
                                        ? "number"
                                        : "text"}
                                    bind:value={temporaryInputOfAttribute[
                                        attr.name
                                    ]}
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#34495E]"
                                    placeholder={`Enter ${entityName} ${attr.name.replace(/_/g, " ")}`}
                                />
                            {/if}
                            {#if attr.data_type != "address"}
                                <button
                                    class="bg-[#34495E] text-white px-4 rounded-md text-sm h-8"
                                    on:click={() =>
                                        addInputValueOfAttribute(attr.name)}
                                >
                                    Add
                                </button>
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>

            <div class="flex justify-end space-x-4 mt-6 text-sm">
                <button
                    class="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
                    on:click={() => (isFilterModalOpen = false)}
                >
                    Cancel
                </button>
                <button
                    class="px-4 py-2 bg-[#34495E] text-white rounded-lg"
                    on:click={() => {
                        console.log("Filters applied:", attributeInputValues);
                        handleApplyFilters(attributeInputValues);
                    }}
                >
                    Apply Filters
                </button>
            </div>
        </div>
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
