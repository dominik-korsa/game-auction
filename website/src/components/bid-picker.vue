<template>
  <v-card outlined class="py-2 py-sm-4 align-self-stretch">
    <div class="px-2 px-sm-4">
      <v-btn
        v-if="lastBidPrice === null"
        outlined
        block
        class="mb-4"
        @click="bid(options.startingPrice)"
      >
        Zalictuj cenę wywoławczą
      </v-btn>
    </div>
    <v-divider/>
    <div class="px-2 px-sm-4">
      <v-form @submit.prevent="customBid">
        <div class="d-flex align-center mt-4">
          <v-text-field
            v-model="price"
            filled
            type="number"
            :step="options.multiplier"
            :min="minPrice"
            :suffix="options.currency"
            hide-details
          />
          <v-btn
            :color="validState.correction === null ? 'primary' : 'deep-orange'"
            :disabled="!validState.valid"
            large
            class="ml-2 ml-sm-4"
            type="submit"
          >
            <div>
              <div>Licytuj</div>
              <div
                class="font-weight-regular"
                v-if="validState.correction !== null && validState.valid"
              >
                {{ validState.correction }} {{ options.currency }}
              </div>
            </div>
          </v-btn>
        </div>
        <div class="mt-3 d-flex flex-wrap">
          <v-chip :color="validState.minPrice.color" class="mr-2 my-1">
            <v-icon left>{{ validState.minPrice.icon }}</v-icon>
            Min.
            {{ minPrice }} {{ options.currency }}
          </v-chip>
          <v-chip :color="validState.multiplier.color" class="mr-2 my-1">
            <v-icon left>{{ validState.multiplier.icon }}</v-icon>
            Wielokrotność
            {{ options.multiplier }} {{ options.currency }}
          </v-chip>
        </div>
      </v-form>
    </div>
  </v-card>
</template>

<script>
import _ from 'lodash';

export default {
  props: {
    options: {
      type: Object,
      required: true,
    },
    lastBidPrice: {
      type: Number,
      default: null,
    },
    socket: {
      type: Object,
      required: true,
    },
  },
  data: () => ({
    price: '',
  }),
  computed: {
    minPrice() {
      return this.lastBidPrice === null
        ? this.options.startingPrice
        : this.lastBidPrice + this.options.minIncrement;
    },
    validState() {
      const inadequate = { icon: 'mdi-minus', color: 'grey darken-2' };
      const alert = { icon: 'mdi-close', color: 'deep-orange' };
      const error = { icon: 'mdi-close', color: 'red' };
      const valid = { icon: 'mdi-check', color: 'green' };
      const price = parseFloat(this.price);
      if (_.isNaN(price)) {
        return {
          minPrice: inadequate,
          multiplier: inadequate,
          correction: null,
          valid: false,
        };
      }
      const { multiplier } = this.options;
      const minPriceValid = price >= this.minPrice;
      const multiplierValid = price % multiplier === 0;
      let correction = null;
      if (!multiplierValid) correction = Math.ceil(price / multiplier) * multiplier;
      return {
        minPrice: minPriceValid ? valid : error,
        multiplier: multiplierValid ? valid : alert,
        correction,
        valid: minPriceValid,
      };
    },
  },
  methods: {
    bid(price) {
      this.socket.emit('bid', {
        price,
      });
    },
    customBid() {
      if (!this.validState.valid) return;
      if (this.validState.correction !== null) this.bid(this.validState.correction);
      else this.bid(parseFloat(this.price));
      this.price = '';
    },
  },
};
</script>
