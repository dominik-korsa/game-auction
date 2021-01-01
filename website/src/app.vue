<template>
  <v-app>
    <router-view />
  </v-app>
</template>

<style lang="scss">
  .fill-win-height {
    height: 100vh;
  }

  .no-basis {
    flex-basis: 0 !important;
  }

  .background-transition {
    transition: background-color 400ms;
  }
</style>
