<template>
  <v-card outlined class="py-2 py-sm-3 align-self-stretch">
    <div
      v-if="lastBidPrice === null"
      class="px-2 px-sm-4"
    >
      <v-btn
        outlined
        block
        class="mb-2 mb-sm-3"
        @click="bid(options.startingPrice)"
      >
        Cena wywoławcza ({{ options.startingPrice }} {{ options.currency }})
      </v-btn>
    </div>
    <div class="px-sm-2 d-flex">
      <v-btn
        v-for="button in bidButtons"
        :key="button.base"
        outlined
        class="mx-2 mb-2 mb-sm-3 grow text-decoration-none"
        :height="lastBidPrice === null ? undefined : 56"
        @click="bid(button.bid)"
        :disabled="locked"
      >
        <div>
          <div
            class="mb-1"
            :class="{'text--disabled': !locked}"
            v-if="lastBidPrice !== null"
          >
            +{{ button.increase }} {{ options.currency }}
          </div>
          <div>
            {{ button.bid }} {{ options.currency }}
          </div>
        </div>
      </v-btn>
    </div>
    <v-divider/>
    <div class="px-2 px-sm-4 mt-4">
      <bid-picker-custom
        :options="options"
        :bid="bid"
        :min-price="minPrice"
      />
    </div>
  </v-card>
</template>

<script>
import _ from 'lodash';
import BidPickerCustom from '@/components/bid-picker-custom.vue';

export default {
  components: { BidPickerCustom },
  props: {
    options: {
      type: Object,
      required: true,
    },
    lastBidPrice: {
      type: Number,
      default: null,
    },
    bid: {
      type: Function,
      required: true,
    },
    locked: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    minPrice() {
      return this.lastBidPrice === null
        ? this.options.startingPrice
        : this.lastBidPrice + this.options.minIncrement;
    },
    bidButtons() {
      const current = _.defaultTo(this.lastBidPrice, this.options.startingPrice);
      return [1, 2, 5].map((base) => {
        const increase = this.options.minIncrement * base;
        return ({
          base,
          increase,
          bid: current + increase,
        });
      });
    },
  },
};
</script>
