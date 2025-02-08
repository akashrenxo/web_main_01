<script lang="ts">
    import { writable } from "svelte/store";
    import { onMount } from "svelte";
    import { entityStore } from "$lib/stores/apiStores/entityStores";
    import { fade } from "svelte/transition";
    import countryList from "$lib/components/dashboard/countryList/countryList.json";
    import { filterStore } from "$lib/stores/filterStore";

    export let entityName: string;
    export let isOpen = false;
    export let fetchEntities;

    let selectedValue: string = "";
    let selectedAttribute: string = "";

    const closeModal = () => {
        isOpen = false;
    };

    const { attributes, isConnected, fetchEntityAttributes } =
        entityStore(entityName);

    interface Country {
        name: string;
        states: string[];
    }

    const selectedColumn = writable<string>("");
    const selectedColumnDatatype = writable<string>("");
    const countries: Country[] = countryList.countries;
    let tempFilterInput: { [key: string]: string | boolean | number } = {};
    let states: string[] = [];

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

    const handleSave = () => {
        console.log("Selected Attributes:", selectedValue, selectedAttribute);

        let localFilterData = localStorage.getItem("filterByValues");

        try {
            const parsedData =
                localFilterData &&
                localFilterData != "{}" &&
                JSON.parse(localFilterData)[entityName] != undefined
                    ? JSON.parse(localFilterData)
                    : {};
            let entityData = parsedData[entityName] || {};

            Object.entries(tempFilterInput).forEach(([key, value]) => {
                if (entityData[key]) {
                    if (!entityData[key].includes(value)) {
                        entityData[key].push(value);
                    }
                } else {
                    entityData[key] = [value];
                }
            });

            parsedData[entityName] = entityData;
            console.log("Updated data:", parsedData);

            filterStore.update(() => ({
                values: parsedData,
                visible: true,
            }));
            localStorage.setItem("filterByValues", JSON.stringify(parsedData));

            fetchEntities(5, 0, "", [], "", "", entityData);
            closeModal();
        } catch (error) {
            console.error("Error processing data:", error);
            return null;
        }
    };

    $: if ($selectedColumn) {
        tempFilterInput = {};
    }

    $: states = tempFilterInput.country
        ? countries.find((country) => country.name === tempFilterInput.country)
              ?.states || []
        : [];

    const handleCountryChange = (event: any) => {
        const selectedCountry = event.target.value;
        tempFilterInput["country"] = selectedCountry;
        tempFilterInput.country = selectedCountry;
    };
</script>

<div
    transition:fade={{ duration: 150 }}
    class="absolute top-0 w-fit bg-white rounded-lg shadow-lg border border-slate-200 p-4 z-50"
>
    <div class="space-y-4">
        <div class=" flex flex-row items-center space-x-3">
            <div>
                <select
                    class="px-3 py-2 border border-gray-500 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    on:change={(e) => {
                        selectedValue = "";
                        const target = e.target as HTMLSelectElement;
                        selectedAttribute = target.value;
                        const selectedName = target.value.replace(/\s/g, "_");
                        selectedColumn.set(selectedName);
                        const selectedAttr = $attributes.find(
                            (attr) => attr.name === selectedName,
                        );

                        if (selectedAttr) {
                            selectedColumnDatatype.set(selectedAttr.data_type);
                        }
                    }}
                >
                    <option disabled selected>Select attribute</option>
                    {#each $attributes as attr}
                        <option value={attr.name}
                            >{attr.name.replace(/_/g, " ")}</option
                        >
                    {/each}
                </select>
            </div>
            <p class=" mb-0">:</p>
            <div>
                {#if $selectedColumnDatatype === ""}
                    <input
                        type="text"
                        disabled={true}
                        class="p-2 border border-gray-500 rounded-lg shadow-sm placeholder-gray-500"
                    />
                {/if}
                {#each $attributes as attr (attr.name)}
                    {#if attr.name !== "location"}
                        <div class="">
                            {#if attr.data_type === "toggle" && $selectedColumnDatatype === "toggle" && $selectedColumn === attr.name}
                                <select
                                    id={attr.name}
                                    bind:value={tempFilterInput[attr.name]}
                                    class="w-[200px] p-2 border border-gray-500 rounded-lg shadow-sm"
                                >
                                    <option value="">Select an option</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                </select>
                            {:else if attr.data_type === "address" && $selectedColumnDatatype === "address" && $selectedColumn === attr.name}
                                <div class="space-y-2">
                                    <div class="flex flex-row gap-6">
                                        <input
                                            type="text"
                                            placeholder="line1"
                                            bind:value={tempFilterInput[
                                                "line1"
                                            ]}
                                            class="p-2 border border-gray-500 rounded-lg shadow-sm mb-2 placeholder-gray-500"
                                        />
                                        <input
                                            type="text"
                                            placeholder="line2"
                                            bind:value={tempFilterInput[
                                                "line2"
                                            ]}
                                            class="p-2 border border-gray-500 rounded-lg shadow-sm mb-2 placeholder-gray-500"
                                        />
                                    </div>
                                    <div class="flex flex-row gap-6">
                                        <input
                                            type="text"
                                            placeholder="line3"
                                            bind:value={tempFilterInput[
                                                "line3"
                                            ]}
                                            class="w-full p-2 border border-gray-500 rounded-lg shadow-sm mb-2 placeholder-gray-500"
                                        />
                                        <input
                                            type="text"
                                            placeholder="City"
                                            bind:value={tempFilterInput["city"]}
                                            class="w-full p-2 border border-gray-500 rounded-lg shadow-sm mb-2 placeholder-gray-500"
                                        />
                                    </div>
                                    <div class="flex flex-row gap-6">
                                        <select
                                            bind:value={tempFilterInput[
                                                "country"
                                            ]}
                                            on:change={handleCountryChange}
                                            class="w-full p-2 border rounded-lg shadow-sm mb"
                                        >
                                            <option value="" disabled selected
                                                >Select Country</option
                                            >
                                            {#each countries as country}
                                                <option value={country.name}
                                                    >{country.name}</option
                                                >
                                            {/each}
                                        </select>
                                        <select
                                            class="w-full p-2 border border-gray-500 rounded-lg shadow-sm mb-2 placeholder-gray-500"
                                            disabled={!states.length}
                                            bind:value={tempFilterInput[
                                                "state"
                                            ]}
                                        >
                                            <option value="">
                                                {states.length
                                                    ? "Select State"
                                                    : "No states available"}
                                            </option>
                                            {#each states as state}
                                                <option value={state}>
                                                    {state}
                                                </option>
                                            {/each}
                                        </select>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Zip Code"
                                        bind:value={tempFilterInput["zip"]}
                                        class="w-full p-2 border border-gray-500 rounded-lg shadow-sm mb-2 placeholder-gray-500"
                                    />
                                </div>
                            {:else if (attr.data_type === "text" || attr.data_type === "number" || attr.data_type === "id") && ($selectedColumnDatatype === "text" || $selectedColumnDatatype === "number" || $selectedColumnDatatype === "id") && $selectedColumn === attr.name}
                                <input
                                    id={attr.name}
                                    type={attr.data_type === "number"
                                        ? "number"
                                        : "text"}
                                    class="p-2 border border-gray-500 rounded-lg shadow-sm placeholder-gray-500 w-[200px]"
                                    bind:value={tempFilterInput[attr.name]}
                                    placeholder={`${
                                        attr.name == "name"
                                            ? "Enter" +
                                              " " +
                                              entityName +
                                              " " +
                                              attr.name.replace(/_/g, " ")
                                            : attr.name.replace(/_/g, " ")
                                    }`}
                                />
                            {/if}
                        </div>
                    {/if}
                {/each}
            </div>
        </div>
        <div class=" flex justify-end space-x-3">
            <button
                on:click={closeModal}
                class="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
                aria-label="Close modal"
            >
                cancel
            </button>
            <button
                type="submit"
                class="px-4 py-2 bg-[#00B894] text-white rounded-lg hover:bg-[#008B72] transition duration-150 ease-in-out"
                on:click={handleSave}
            >
                Add Filter
            </button>
        </div>
    </div>
</div>
