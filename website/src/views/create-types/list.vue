<template>
  <v-card outlined max-width="600">
    <v-card-title>Wybierz typ aukcji</v-card-title>
    <v-list subheader>
      <v-list-item v-for="type in types" :key="type.value" :to="`/create/${type.value}`">
        <v-list-item-content>
          <v-list-item-title>{{ type.title }}</v-list-item-title>
          <v-list-item-subtitle class="text-wrap">{{ type.description }}</v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-action v-if="$vuetify.breakpoint.smAndUp">
          <v-icon>mdi-arrow-right</v-icon>
        </v-list-item-action>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script>
import auctionTypes from '@/auction-types';

export default {
  data: () => ({
    types: auctionTypes,
  }),
};
</script>
