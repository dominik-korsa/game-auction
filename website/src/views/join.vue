<template>
  <v-container class="fill-height d-flex flex-column align-center justify-center" >
    <template v-if="notFound">
      <v-icon :size="96" color="red">
        mdi-alert
      </v-icon>
      <h4 class="text-h4 mt-12">Nie znaleziono aukcji</h4>
      <v-btn color="primary" large class="mt-12" min-width="200" to="/">Wróć</v-btn>
    </template>
    <template v-else>
      <v-progress-circular indeterminate color="primary" :size="96" />
      <h4 class="text-h4 mt-12">Dołączanie do aukcji</h4>
    </template>
  </v-container>
</template>

<script>
import _ from 'lodash';

export default {
  data: () => ({
    notFound: false,
  }),
  watch: {
    '$route.params.code': {
      async handler(value) {
        this.notFound = false;
        try {
          await new Promise((resolve) => setTimeout(resolve, _.random(100, 300)));
          const response = await fetch(
            new URL('/api/join-room', this.$app.serverHost),
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                code: parseInt(value, 10),
              }),
            },
          );
          const body = await response.json();
          if (body.found) {
            sessionStorage.setItem('room', JSON.stringify({
              roomId: body.roomId,
              playerId: body.playerId,
              token: body.roomToken,
            }));
            await this.$router.replace('/auction');
          } else {
            this.notFound = true;
          }
        } catch (error) {
          console.error(error);
          // TODO: Add error handling
        }
      },
      immediate: true,
    },
  },
};
</script>
