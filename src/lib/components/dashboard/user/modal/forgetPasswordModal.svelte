<script lang="ts">
    import hide from "$lib/../../src/assests/images/genericPage/hide01.png";
    import show from "$lib/../../src/assests/images/genericPage/show01.png";
    import { addToast } from "$lib/stores/toastStore";
    import { userStore } from "$lib/stores/apiStores/userStore";

    export let activeMenuUserId: string;
    export let showUserPasswordModal;

    let showNewPassword = false;
    let showConfirmPassword = false;

    let password: string = "";
    let confirmPassword: string = "";
    let touched = { password: false, confirmPassword: false };

    $: passwordsMatch = password === confirmPassword;
    $: showError = touched.confirmPassword && !passwordsMatch;

    const { updateUserPassword } = userStore("user");

    const handleSubmit = () => {
        if (passwordsMatch) {
            updateUserPassword(activeMenuUserId, password);
            showUserPasswordModal = false;
        }
    };
</script>

<div
    class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 text-sm"
>
    <div class="bg-white rounded-lg shadow-lg w-[400px]">
        <div class="w-full p-6 bg-white rounded-lg shadow">
            <h2
                class="mb-1 text-sm font-medium leading-tight tracking-tight text-gray-900"
            >
                Add New Password
            </h2>

            <form class="mt-4 space-y-4 lg:mt-5 md:space-y-5">
                <div>
                    <label
                        for="user"
                        class="block mb-2 text-xs font-medium text-gray-900"
                    >
                        User
                    </label>
                    <input
                        type="text"
                        name="user"
                        id="user"
                        disabled
                        value={activeMenuUserId}
                        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                    />
                </div>

                <div>
                    <label
                        for="password"
                        class="block mb-2 text-xs font-medium text-gray-900"
                    >
                        New Password
                    </label>
                    <div class="relative">
                        <input
                            id="password"
                            name="password"
                            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 pr-10"
                            type={showNewPassword ? "text" : "password"}
                            placeholder="••••••••"
                            bind:value={password}
                            on:blur={() => (touched.password = true)}
                        />
                        <button
                            type="button"
                            class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                            on:click={() =>
                                (showNewPassword = !showNewPassword)}
                        >
                            {#if !showNewPassword}
                                <img src={hide} alt="hide" class=" h-5" />
                            {:else}
                                <img src={show} alt="show" class=" h-4" />
                            {/if}
                        </button>
                    </div>
                </div>

                <div>
                    <label
                        for="confirm-password"
                        class="block mb-2 text-xs font-medium text-gray-900"
                    >
                        Confirm Password
                    </label>
                    <div class="relative">
                        <input
                            id="confirm-password"
                            name="confirm-password"
                            class="bg-gray-50 border {showError
                                ? 'border-red-500'
                                : 'border-gray-300'} text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 pr-10"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            bind:value={confirmPassword}
                            on:blur={() => (touched.confirmPassword = true)}
                        />
                        <button
                            type="button"
                            class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                            on:click={() =>
                                (showConfirmPassword = !showConfirmPassword)}
                        >
                            {#if !showConfirmPassword}
                                <img src={hide} alt="hide" class=" h-5" />
                            {:else}
                                <img src={show} alt="show" class=" h-5" />
                            {/if}
                        </button>
                    </div>
                    {#if showError}
                        <p class="mt-1 text-xs text-red-500">
                            Passwords do not match
                        </p>
                    {/if}
                </div>

                <div class="flex flex-row justify-end space-x-3">
                    <button
                        type="button"
                        class="px-4 py-2 bg-gray-300 hover:bg-gray-400 font-medium rounded-lg text-xs"
                        on:click={() => {
                            showUserPasswordModal = false;
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        on:click={handleSubmit}
                        disabled={!password ||
                            !confirmPassword ||
                            !passwordsMatch}
                        class="bg-primary-600 bg-[#34495E] text-white font-medium rounded-lg px-4 py-2 text-center border text-xs disabled:opacity-50"
                    >
                        Reset Password
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>
