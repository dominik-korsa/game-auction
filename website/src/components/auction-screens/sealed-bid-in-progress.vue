<template>
  <v-container
    class="
      sealed-bid-in-progress-screen fill-height overflow-y-auto
      flex-column flex-nowrap align-stretch
    "
  >
    <v-card outlined class="mb-2">
      <v-card-title>
        {{ bidPlayers.length }} / {{ playersCount }}
        <span class="text--secondary ml-1">graczy zalicytowało</span>
      </v-card-title>
      <v-expand-transition>
        <div v-if="bidPlayers.length < (options.secondPriceMode ? 2 : 1)">
          <v-divider />
          <v-alert
            class="my-0"
            color="red"
            text
            tile
          >
            {{
              options.secondPriceMode
                ? 'Co najmniej dwaj gracze muszą zalicytować'
                : 'Co najmniej jeden gracz musi zalicytować'
            }}
          </v-alert>
        </div>
      </v-expand-transition>
    </v-card>
    <progress-bar
      v-if="endTimestamp !== null"
      class="mb-2"
      :end-timestamp="endTimestamp"
      :duration="options.totalTime"
    />
    <v-spacer />
    <v-card outlined v-if="hasBid">
      <v-card-title class="text-center d-block">Zalicytowałeś</v-card-title>
    </v-card>
    <v-card outlined class="pa-2 pa-sm-4" v-else-if="selfPlayer !== null">
      <bid-picker-custom
        :min-price="options.minPrice"
        :bid="bid"
        :options="options"
      />
    </v-card>
  </v-container>
</template>

<script>
import ProgressBar from '@/components/progress-bar.vue';
import BidPickerCustom from '@/components/bid-picker-custom.vue';

export default {
  components: { BidPickerCustom, ProgressBar },
  props: {
    options: {
      type: Object,
      required: true,
    },
    socket: {
      type: Object,
      required: true,
    },
    endTimestamp: {
      type: Number,
      default: null,
    },
    selfPlayer: {
      type: Object,
      default: null,
    },
    bidPlayers: {
      type: Array,
      required: true,
    },
    playersCount: {
      type: Number,
      required: true,
    },
  },
  methods: {
    bid(price) {
      this.socket.emit('bid', {
        price,
      });
    },
  },
  computed: {
    hasBid() {
      return this.bidPlayers.includes(this.selfPlayer.id);
    },
  },
};
</script>

<style lang="scss">
.sealed-bid-in-progress-screen {
  max-width: 600px;
}
</style>
