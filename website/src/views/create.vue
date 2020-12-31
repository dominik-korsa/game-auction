<template>
  <div class="fill-height d-flex flex-column">
    <v-btn icon large class="ma-2" to="/">
      <v-icon>
        mdi-arrow-left
      </v-icon>
    </v-btn>
    <v-container class="grow d-flex flex-column align-center justify-center">
      <v-scroll-y-transition mode="out-in">
        <router-view class="my-3 my-sm-8" />
      </v-scroll-y-transition>
    </v-container>
  </div>
</template>
