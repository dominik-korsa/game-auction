<template>
  <v-container
    class="british-auction-screen fill-height flex-column flex-nowrap align-stretch overflow-y-auto"
  >
    <v-card
      :color="lastBid === null ? 'grey darken-3' : lastBid.player.color"
      class="px-2 py-4 background-transition mb-2"
    >
      <div v-if="lastBid === null">
        <div class="text-h3 text-center">Brak ofert</div>
        <div class="text-h5 text-center mt-3">
          <span class="text--secondary">Cena wywoławcza:</span>
          {{ options.startingPrice }} {{ options.currency }}
        </div>
      </div>
      <div v-else>
        <div class="text-h3 text-center">{{ lastBid.price }} {{ options.currency }}</div>
        <div class="text-h5 text-center mt-3">{{ lastBid.player.name }}</div>
      </div>
    </v-card>
    <progress-bar
      v-if="endTimestamp !== null"
      class="mb-2"
      :end-timestamp="endTimestamp"
      :duration="options.timePerBid"
    />
    <v-card outlined class="overflow-y-auto pr-4 timeline-card grow d-flex flex-column no-basis">
      <v-timeline dense class="grow">
        <v-timeline-item
          v-for="bid in bidHistoryItems"
          :key="bid.id"
          :color="bid.player.color"
          small
        >
          <div class="d-flex">
            <div class="text-right" :style="`color: ${bid.player.color}`">
              {{ bid.player.name }}
            </div>
            <v-spacer class="mx-1 mx-sm-2" />
            <div>
              {{ bid.price }} {{ options.currency }}
            </div>
          </div>
        </v-timeline-item>
        <v-timeline-item color="grey">
          <v-card outlined>
            <v-card-title>Rozpoczęcie aukcji</v-card-title>
            <v-card-subtitle>
              Cena wywoławcza:
              <span class="text--primary">{{ options.startingPrice }} {{ options.currency }}</span>
            </v-card-subtitle>
          </v-card>
        </v-timeline-item>
      </v-timeline>
    </v-card>
    <bid-picker
      class="mt-2"
      v-if="selfPlayer !== null && !finished"
      :options="options"
      :socket="socket"
      :last-bid-price="lastBidPrice"
      :locked="locked"
      :bid="bid"
    />
  </v-container>
</template>

<script>
import BidPicker from '@/components/bid-picker.vue';
import ProgressBar from '@/components/progress-bar.vue';
import _ from 'lodash';

export default {
  components: { ProgressBar, BidPicker },
  props: {
    options: {
      type: Object,
      required: true,
    },
    selfPlayer: {
      type: Object,
      default: null,
    },
    players: {
      type: Object,
      required: true,
    },
    socket: {
      type: Object,
      required: true,
    },
    bidHistory: {
      type: Array,
      required: true,
    },
    endTimestamp: {
      type: Number,
      default: null,
    },
    finished: {
      type: Boolean,
      default: false,
    },
    locked: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    bidHistoryItems() {
      return this.bidHistory.map((bid) => ({
        price: bid.price,
        player: this.players[bid.playerId],
      })).reverse();
    },
    lastBid() {
      return _.first(this.bidHistoryItems) || null;
    },
    lastBidPrice() {
      if (this.lastBid === null) return null;
      return this.lastBid.price;
    },
  },
  methods: {
    bid(price) {
      this.socket.emit('bid', {
        price,
      });
    },
  },
};
</script>

<style lang="scss">
.british-auction-screen {
  max-width: 600px;

  .timeline-card {
    min-height: 100px;
  }
}
</style>
