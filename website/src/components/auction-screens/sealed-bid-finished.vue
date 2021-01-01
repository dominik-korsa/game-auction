<template>
  <v-container
    class="sealed-bid-finished-screen fill-height overflow-y-auto
     flex-column flex-nowrap align-stretch justify-center"
  >
    <v-card outlined class="overflow-hidden mb-2 px-2 pt-2 pb-4">
      <v-sheet
        v-for="player in winnerPlayers"
        :key="player.id"
        :color="player.color"
        rounded
        class="px-4 py-2 mb-2 text-h5 text-center"
      >
        {{ player.name }}
        <span class="font-weight-thin" v-if="player.id === playerId">(ty)</span>
      </v-sheet>
      <div class="text-h5 text-center mt-4">Cena dla nabywcy</div>
      <div class="text-h3 text-center mt-2">{{ result.price }} {{ options.currency }}</div>
    </v-card>
    <v-card outlined>
      <v-card-title>Lista ofert</v-card-title>
      <div class="pb-2">
        <div
          v-for="bid in bidItems"
          :key="bid.player.id"
          class="d-flex align-center px-2 px-sm-4 my-3"
        >
          <div class="text-right" :style="`color: ${bid.player.color}`">
            {{ bid.player.name }}
          </div>
          <v-spacer class="mx-1 mx-sm-2" />
          <div>
            {{ bid.price }} {{ options.currency }}
          </div>
        </div>
      </div>
    </v-card>
  </v-container>
</template>

<script>
export default {
  props: {
    result: {
      type: Object,
      required: true,
    },
    players: {
      type: Object,
      required: true,
    },
    options: {
      type: Object,
      required: true,
    },
    playerId: {
      type: String,
      required: true,
    },
  },
  computed: {
    winnerPlayers() {
      return this.result.winners.map((winner) => this.players[winner.playerId]);
    },
    bidItems() {
      return this.result.bids.map((bid) => ({
        player: this.players[bid.playerId],
        price: bid.price,
      }));
    },
  },
};
</script>

<style lang="scss">
  .sealed-bid-finished-screen {
    max-width: 600px;
  }
</style>
