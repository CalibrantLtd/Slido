<template>
  <div id="loading" data-testid="loading-component" class="bg-gray-900 backdrop-blur-sm bg-opacity-10 z-50">
    <div class="flex space-x-2 h-screen align-middle p-5 justify-center items-center scale-150 -mt-10">
      <div class="animate-bounce">
        <div class="p-2 w-8 h-8 mr-4 mt-8 -skew-y-12 green-circle" style="background-color: #55B691;"></div>
      </div>
      <div class="animate-bounce delay-75">
        <div class="p-2 w-8 h-8 mr-4 mt-16 -skew-y-12 green-circle" style="background-color: #55B691;"></div>
      </div>
      <div class="transition duration-100 animate-bounce">
        <div class="p-2 w-8 h-8 mt-32 -skew-y-12 green-circle" style="background-color: #55B691;"></div>
      </div>
    </div>
  </div>
</template>

<style>
#loading {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
  width: 100vw;
  height: 100vh;
}
</style>
