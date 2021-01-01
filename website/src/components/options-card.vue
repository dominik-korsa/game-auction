<template>
  <v-card outlined>
    <v-card-title>Zasady aukcji</v-card-title>
    <v-list subheader>
      <v-list-item>
        <v-list-item-content>
          <v-list-item-subtitle class="text-overline">
            Typ aukcji
          </v-list-item-subtitle>
          <v-list-item-title>{{ typeInfo.title }}</v-list-item-title>
          <v-list-item-subtitle class="text-wrap">
            {{ typeInfo.description }}
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
      <v-list-item>
        <v-list-item-content>
          <v-list-item-subtitle class="text-overline">Mnożnik</v-list-item-subtitle>
          <v-list-item-title>
            {{ options.multiplier }} {{ options.currency }}
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <template v-if="options.type === 'british'">
        <v-list-item>
          <v-list-item-content>
            <v-list-item-subtitle class="text-overline">Cena wywoławcza</v-list-item-subtitle>
            <v-list-item-title>
              {{ options.startingPrice }} {{ options.currency }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item>
          <v-list-item-content>
            <v-list-item-subtitle class="text-overline">Kwota postąpienia</v-list-item-subtitle>
            <v-list-item-title>
              {{ options.minIncrement }} {{ options.currency }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item>
          <v-list-item-content>
            <v-list-item-subtitle class="text-overline">Czas na ofertę</v-list-item-subtitle>
            <v-list-item-title>{{ timePerBidString }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </template>
      <template v-if="options.type === 'dutch'">
        <v-list-item>
          <v-list-item-content>
            <v-list-item-subtitle class="text-overline">Cena początkowa</v-list-item-subtitle>
            <v-list-item-title>
              {{ options.startingPrice }} {{ options.currency }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item>
          <v-list-item-content>
            <v-list-item-subtitle class="text-overline">Cena końcowa</v-list-item-subtitle>
            <v-list-item-title>
              {{ options.endingPrice }} {{ options.currency }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </template>
      <template v-if="options.type === 'sealed-bid'">
        <v-list-item>
          <v-list-item-content>
            <v-list-item-subtitle class="text-overline">Cena minimalna</v-list-item-subtitle>
            <v-list-item-title>
              {{ options.minPrice }} {{ options.currency }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item>
          <v-list-item-content>
            <v-list-item-subtitle class="text-overline">Cena dla nabywcy</v-list-item-subtitle>
            <v-list-item-title>
              {{ options.secondPriceMode ? 'Druga najwyższa oferta' : 'Najwyższa (swoja) oferta' }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </template>
      <v-list-item v-if="['dutch', 'sealed-bid'].includes(options.type)">
        <v-list-item-content>
          <v-list-item-subtitle class="text-overline">Łączny czas</v-list-item-subtitle>
          <v-list-item-title>
            {{ totalTimeString }}
          </v-list-item-title>
        </v-list-item-content>
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
  props: {
    options: {
      type: Object,
      required: true,
    },
  },
  methods: {
    timeString(milliseconds) {
      const time = milliseconds / 1000;
      const strings = {
        one: 'sekunda',
        few: 'sekundy',
        many: 'sekund',
      };
      const rules = new Intl.PluralRules('pl');
      return `${time} ${strings[rules.select(time)]}`;
    },
  },
  computed: {
    typeInfo() {
      return this.types.find((e) => e.value === this.options.type);
    },
    timePerBidString() {
      return this.timeString(this.options.timePerBid);
    },
    totalTimeString() {
      return this.timeString(this.options.totalTime);
    },
  },
};
</script>
