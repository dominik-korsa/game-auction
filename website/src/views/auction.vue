<template>
  <v-container
    v-if="loadingText !== null"
    class="d-flex align-center justify-center flex-column fill-height"
  >
    <v-progress-circular indeterminate :size="96" color="primary" />
    <h4 class="text-h4 mt-12">{{ loadingText }}</h4>
  </v-container>
  <v-main v-else class="fill-win-height">
    <v-overlay absolute :value="paused">
      <v-card outlined light class="d-flex flex-column">
        <v-icon :size="128" class="align-self-center" color="primary">mdi-pause</v-icon>
        <v-divider />
        <v-card-title>Aukcja wstrzymana</v-card-title>
        <v-card-actions>
          <v-btn block outlined color="primary" @click="resume">Wznów</v-btn>
        </v-card-actions>
      </v-card>
    </v-overlay>
    <auction-app-bar
      :code="code"
      :self-player="selfPlayer"
      :players-array="playersArray"
      :socket="socket"
      :state="state"
    />
    <not-started-screen
      v-if="state === 'not-started'"
      :players-array="playersArray"
      :self-player="selfPlayer"
      :socket="socket"
      :options="options"
      :player-id="playerId"
    />
    <v-container
      v-else-if="state === 'countdown'"
      class="auction-countdown-screen fill-height d-flex align-center justify-center text-center"
    >
      <h2 class="text-h4 text-sm-h3" v-if="countdownTime === null">Startowanie</h2>
      <h1 class="countdown-time" v-else>{{ countdownTime }}</h1>
    </v-container>
    <british-auction-screen
      v-else-if="options.type === 'british'"
      :options="options"
      :self-player="selfPlayer"
      :socket="socket"
      :bid-history="bidHistory"
      :players="players"
      :end-timestamp="endTimestamp"
      :finished="state === 'finished'"
      :locked="locked"
    />
    <dutch-auction-screen
      v-else-if="options.type === 'dutch'"
      :options="options"
      :socket="socket"
      :current-price="currentPrice"
      :finished="state === 'finished'"
      :buyer="buyer"
      :players="players"
      :self-player="selfPlayer"
    />
    <template v-else-if="options.type === 'sealed-bid'">
      <sealed-bid-in-progress-screen
        v-if="state === 'in-progress'"
        :options="options"
        :socket="socket"
        :end-timestamp="endTimestamp"
        :players-count="playersArray.length"
        :self-player="selfPlayer"
        :bid-players="bidPlayers"
      />
      <sealed-bid-finished
        v-else-if="state === 'finished'"
        :result="result"
        :players="players"
        :options="options"
        :playerId="playerId"
      />
    </template>
  </v-main>
</template>

<script>
import { io } from 'socket.io-client';
import _ from 'lodash';
import NotStartedScreen from '@/components/auction-screens/not-started.vue';
import BritishAuctionScreen from '@/components/auction-screens/british-auction.vue';
import DutchAuctionScreen from '@/components/auction-screens/dutch-auction.vue';
import SealedBidInProgressScreen from '@/components/auction-screens/sealed-bid-in-progress.vue';
import SealedBidFinished from '@/components/auction-screens/sealed-bid-finished.vue';
import AuctionAppBar from '@/components/auction-app-bar.vue';

export default {
  components: {
    AuctionAppBar,
    SealedBidFinished,
    SealedBidInProgressScreen,
    DutchAuctionScreen,
    BritishAuctionScreen,
    NotStartedScreen,
  },
  data: () => ({
    playerId: null,
    socket: null,
    connected: false,

    code: null,
    options: null,
    players: null,
    state: null,
    bidHistory: null,
    currentPrice: null,
    buyer: null,
    bidPlayers: null,
    result: null,
    paused: null,

    countdownTime: null,
    endTimestamp: null,
    lockTimeoutId: null,
    isFullscreen: false,
  }),
  created() {
    navigator.vibrate(0);
    const roomString = sessionStorage.getItem('room');
    if (roomString === null) {
      this.$router.push('/');
      return;
    }
    const room = JSON.parse(roomString);
    this.playerId = room.playerId;
    const url = new URL(`/room/${room.roomId}`, this.$app.serverHost).toString();
    this.socket = io(url, {
      auth: {
        roomAccessToken: `bearer ${room.token}`,
      },
    });
    this.socket.on('update:code', (code) => { this.code = code; });
    this.socket.on('update:auction-options', (options) => { this.options = options; });
    this.socket.on('update:players', (players) => { this.players = players; });
    this.socket.on('update:state', (state) => { this.state = state; });
    this.socket.on('update:bid-history', (history) => { this.bidHistory = history; });
    this.socket.on('update:current-price', (price) => { this.currentPrice = price; });
    this.socket.on('update:buyer', (buyer) => { this.buyer = buyer; });
    this.socket.on('update:bid-players', (players) => { this.bidPlayers = players; });
    this.socket.on('update:result', (result) => { this.result = result; });
    this.socket.on('update:paused', (paused) => { this.paused = paused; });
    this.socket.on('time-left', (timeLeft) => {
      if (timeLeft === null) this.endTimestamp = null;
      else this.endTimestamp = Date.now() + timeLeft;
    });
    this.socket.on('lock', () => {
      if (this.lockTimeoutId !== null) clearTimeout(this.lockTimeoutId);
      this.lockTimeoutId = setTimeout(() => {
        this.lockTimeoutId = null;
      }, 500);
    });
    this.socket.on('connect', () => {
      this.code = null;
      this.options = null;
      this.players = null;
      this.state = null;
      this.bidHistory = null;
      this.currentPrice = null;
      this.buyer = null;
      this.bidPlayers = null;
      this.result = null;
      this.paused = null;

      this.countdownTime = null;
      this.connected = true;
    });
    this.socket.on('disconnect', () => {
      this.connected = false;
      if (this.lockTimeoutId !== null) {
        clearTimeout(this.lockTimeoutId);
        this.lockTimeoutId = null;
      }
    });
    this.socket.on('connect_error', (error) => {
      console.error(error);
      this.$router.push('/');
    });
  },
  methods: {
    async countdown() {
      for (let i = 3; i > 0; i -= 1) {
        this.countdownTime = i;
        navigator.vibrate(200);
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      navigator.vibrate(500);
    },
    resume() {
      this.socket.emit('resume');
    },
  },
  computed: {
    loadingText() {
      if (!this.connected) return 'Łączenie z serwerem';
      if (this.options === null) return 'Wczytywanie opcji aukcji';
      if (this.players === null) return 'Wczytywanie listy graczy';
      if (this.state === null) return 'Wczytywanie stanu gry';
      if (this.paused === null) return 'Wczytywanie informacji o pauzie';
      if (this.options.type === 'british') {
        if (this.bidHistory === null) return 'Wczytywanie historii ofert';
      } else if (this.options.type === 'dutch') {
        if (['in-progress', 'finished'].includes(this.state) && this.currentPrice === null) return 'Wczytywanie aktualnej ceny';
      } else if (this.options.type === 'sealed-bid') {
        if (this.bidPlayers === null) return 'Wczytywanie listy ofert graczy';
        if (this.state === 'finished' && this.result === null) return 'Wczytywanie wyniku';
      }
      return null;
    },
    selfPlayer() {
      return this.players[this.playerId] || null;
    },
    playersArray() {
      return _.values(this.players);
    },
    locked() {
      return this.lockTimeoutId !== null;
    },
  },
  watch: {
    state: {
      handler(value, oldValue) {
        if (value === 'countdown') {
          if (oldValue === 'not-started') this.countdown();
          else this.countdownTime = null;
        }
      },
      immediate: true,
    },
  },
  destroyed() {
    if (this.socket) this.socket.close();
  },
};
</script>

<style lang="scss">
  .auction-countdown-screen {
    .countdown-time {
      font-size: 15em;
      font-weight: 300;
    }
  }
</style>
