<template>
  <div>
    <div v-if="loading">
      <mwc-circular-progress indeterminate></mwc-circular-progress>
    </div>
    <div v-else>
      <div id="content" style="display: flex; flex-direction: column; flex: 1;">
        <CreateTodoItem></CreateTodoItem>
        <MyTodos :author="(client?.myPubKey as Object)"></MyTodos>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, computed } from 'vue';
import { AppAgentClient, AppAgentWebsocket } from '@holochain/client';
import '@material/mwc-circular-progress';
import MyTodos from './todos/todos/MyTodos.vue';
import CreateTodoItem from './todos/todos/CreateTodoItem.vue';

export default defineComponent({
  components: {
    // Add your subcomponents here
    MyTodos,
    CreateTodoItem,
  },
  data(): {
    client: AppAgentClient | undefined;
    loading: boolean;
  } {
    return {
      client: undefined,
      loading: true,
    };
  },
  async mounted() {
    // We pass '' as url because it will dynamically be replaced in launcher environments
    this.client = await AppAgentWebsocket.connect('', 'my-test-happ');

    this.loading = false;
  },
  provide() {
    return {
      client: computed(() => this.client),
    };
  },
});
</script>
