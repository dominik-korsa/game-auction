<template>
  <v-container
    class="auction-started-screen fill-height flex-column flex-nowrap align-stretch overflow-y-auto"
  >
    <v-card
      :color="lastBid === null ? 'grey darken-3' : lastBid.player.color"
      outlined
      class="px-2 py-4 background-transition mb-2"
    >
      <div v-if="lastBid === null">
        <h3 class="text-h3 text-center">Brak ofert</h3>
        <h5 class="text-h5 text-center mt-3">
          <span class="text--secondary">Cena wywoławcza:</span>
          {{ options.startingPrice }} {{ options.currency }}
        </h5>
      </div>
      <div v-else>
        <h3 class="text-h3 text-center">{{ lastBid.price }} {{ options.currency }}</h3>
        <h5 class="text-h5 text-center mt-3">{{ lastBid.player.name }}</h5>
      </div>
    </v-card>
    <v-sheet color="#fff4" rounded class="mb-2" v-if="this.progress !== null">
      <v-sheet
        :width="`${progress*100}%`"
        :color="progressColor"
        class="background-transition"
        height="4"
        rounded
      />
    </v-sheet>
    <v-card outlined class="overflow-y-auto pr-2 timeline-card grow d-flex flex-column no-basis">
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
    />
  </v-container>
</template>

<script>
import BidPicker from '@/components/bid-picker.vue';
import _ from 'lodash';

export default {
  components: { BidPicker },
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
  },
  data: () => ({
    timestamp: Date.now(),
    timestampHandle: null,
  }),
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
    progress() {
      if (this.endTimestamp === null) return null;
      const progress = 1 - (this.endTimestamp - this.timestamp) / this.options.timePerBid;
      return _.clamp(progress, 0, 1);
    },
    progressColor() {
      if (this.progress < 0.5) return 'white';
      if (this.progress < 0.75) return 'amber';
      return 'red';
    },
  },
  methods: {
    updateTimestamp() {
      this.timestamp = Date.now();
      this.timestampHandle = requestAnimationFrame(this.updateTimestamp);
    },
  },
  mounted() {
    this.updateTimestamp();
  },
  destroyed() {
    cancelAnimationFrame(this.timestampHandle);
    this.timestampHandle = null;
  },
};
</script>

<style lang="scss">
.auction-started-screen {
  max-width: 600px;

  .timeline-card {
    min-height: 100px;
  }

  .background-transition {
    transition: background-color 400ms;
  }
}
</style>
