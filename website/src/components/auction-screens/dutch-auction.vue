<template>
  <v-container
    class="dutch-auction-screen fill-height flex-column flex-nowrap align-stretch overflow-y-auto"
  >
    <v-spacer />
    <v-card
      v-if="finished && buyerPlayer === null"
      outlined
      class="px-2 py-6"
    >
      <div class="text-h4 text-center">Brak ofert</div>
    </v-card>
    <v-card
      v-else
      :color="cardColor"
      class="px-2 py-6 background-transition"
      :light="buyerPlayer === null"
    >
      <div class="text-h3 text-center">{{ currentPrice }} {{ options.currency }}</div>
      <v-expand-transition>
        <div v-if="buyerPlayer !== null">
          <div class="text-h5 text-center mt-3">{{ buyerPlayer.name }}</div>
        </div>
      </v-expand-transition>
    </v-card>
    <div class="d-flex mt-2">
      <v-card class="px-2 py-2 py-sm-4 mr-1 grow no-basis" outlined>
        <div class="text-overline text-center text--secondary">Cena początkowa</div>
        <div class="text-h5 text-center">{{ options.startingPrice }} {{ options.currency }}</div>
      </v-card>
      <v-card class="px-2 py-2 py-sm-4 ml-1 grow no-basis" outlined>
        <div class="text-overline text-center text--secondary">Cena końcowa</div>
        <div class="text-h5 text-center">{{ options.endingPrice }} {{ options.currency }}</div>
      </v-card>
    </div>
    <v-spacer />
    <v-expand-transition>
      <v-btn
        v-if="!finished && selfPlayer !== null"
        color="primary"
        x-large
        @click="bid"
      >
        Licytuj
      </v-btn>
    </v-expand-transition>
  </v-container>
</template>

<script>
export default {
  props: {
    options: {
      type: Object,
      required: true,
    },
    socket: {
      type: Object,
      required: true,
    },
    currentPrice: {
      type: Number,
      required: true,
    },
    finished: {
      type: Boolean,
      default: false,
    },
    buyer: {
      type: Object,
      default: null,
    },
    players: {
      type: Object,
      required: true,
    },
    selfPlayer: {
      type: Object,
      default: null,
    },
  },
  computed: {
    buyerPlayer() {
      if (this.buyer === null) return null;
      return this.players[this.buyer.playerId];
    },
    cardColor() {
      if (this.buyerPlayer !== null) return this.buyerPlayer.color;
      if (this.currentPrice === this.options.endingPrice) return 'grey lighten-1';
      return undefined;
    },
  },
  methods: {
    bid() {
      this.socket.emit('bid');
    },
  },
};
</script>

<style lang="scss">
.dutch-auction-screen {
  max-width: 600px;
}
</style>
