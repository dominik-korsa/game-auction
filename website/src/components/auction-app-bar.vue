<template>
  <v-app-bar app>
    <v-btn icon large to="/">
      <v-icon>
        mdi-arrow-left
      </v-icon>
    </v-btn>
    <v-spacer />
    <div v-if="$vuetify.breakpoint.width > 360">
      Kod: <b>{{ code }}</b>
    </div>
    <qr-dialog :code="code">
      <template #activator="{ on }">
        <v-btn icon class="ml-1" v-on="on">
          <v-icon>
            mdi-qrcode
          </v-icon>
        </v-btn>
      </template>
    </qr-dialog>
    <v-btn icon class="ml-1" @click="pause" v-if="state === 'in-progress'">
      <v-icon>mdi-pause</v-icon>
    </v-btn>
    <v-btn v-if="isFullscreen" icon class="ml-1" @click="exitFullscreen">
      <v-icon >
        mdi-fullscreen-exit
      </v-icon>
    </v-btn>
    <v-btn v-else icon class="ml-1" @click="requestFullscreen">
      <v-icon>
        mdi-fullscreen
      </v-icon>
    </v-btn>
    <create-player-dialog
      v-if="selfPlayer === null"
      :socket="socket"
      :players-array="playersArray"
    >
      <template #activator="{ on }">
        <v-btn
          color="primary"
          class="ml-1"
          v-on="on"
        >
          Graj
        </v-btn>
      </template>
    </create-player-dialog>
  </v-app-bar>
</template>

<script>
import CreatePlayerDialog from '@/components/create-player-dialog.vue';
import QrDialog from '@/components/qr-dialog.vue';

export default {
  components: {
    CreatePlayerDialog,
    QrDialog,
  },
  created() {
    this.updateIsFullscreen();
    document.addEventListener('fullscreenchange', this.updateIsFullscreen);
  },
  props: {
    code: {
      type: Number,
      required: true,
    },
    playersArray: {
      type: Array,
      required: true,
    },
    socket: {
      type: Object,
      required: true,
    },
    selfPlayer: {
      type: Object,
      default: null,
    },
    state: {
      type: String,
      required: true,
    },
  },
  methods: {
    async requestFullscreen() {
      await document.documentElement.requestFullscreen({
        navigationUI: 'hide',
      });
    },
    async exitFullscreen() {
      await document.exitFullscreen();
    },
    updateIsFullscreen() {
      this.isFullscreen = document.fullscreenElement !== null;
    },
    pause() {
      this.socket.emit('pause');
    },
  },
  destroyed() {
    if (document.fullscreenElement !== null) document.exitFullscreen();
    document.removeEventListener('fullscreenchange', this.updateIsFullscreen);
  },
};
</script>
