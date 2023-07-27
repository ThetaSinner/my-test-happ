<template>
  <mwc-snackbar ref="create-error"></mwc-snackbar>

  <div style="display: flex; flex-direction: column">
    <span style="font-size: 18px">Create Todo Item</span>
  
    <div style="margin-bottom: 16px">
      <mwc-textarea outlined label="Description" :value="description" @input="description = $event.target.value" required></mwc-textarea>
    </div>

  
    <mwc-button 
      raised
      label="Create Todo Item"
      :disabled="!isTodoItemValid"
      @click="createTodoItem"
    ></mwc-button>
  </div>
</template>
<script lang="ts">
import { defineComponent, inject, ComputedRef } from 'vue';
import { AppAgentClient, Record, AgentPubKey, EntryHash, ActionHash, DnaHash } from '@holochain/client';
import { TodoItem } from './types';
import '@material/mwc-button';
import '@material/mwc-icon-button';
import '@material/mwc-snackbar';
import { Snackbar } from '@material/mwc-snackbar';
import '@material/mwc-textarea';

export default defineComponent({
  data(): {
    description: string;
  } {
    return { 
      description: '',
    }
  },
  computed: {
    isTodoItemValid() {
    return true && this.description !== '';
    },
  },
  mounted() {
  },
  methods: {
    async createTodoItem() {
      const todoItem: TodoItem = { 
        description: this.description!,
      };

      try {
        const record: Record = await this.client.callZome({
          cap_secret: null,
          role_name: 'todos',
          zome_name: 'todos',
          fn_name: 'create_todo_item',
          payload: todoItem,
        });
        this.$emit('todo-item-created', record.signed_action.hashed.hash);
      } catch (e: any) {
        const errorSnackbar = this.$refs['create-error'] as Snackbar;
        errorSnackbar.labelText = `Error creating the todo item: ${e.data.data}`;
        errorSnackbar.show();
      }
    },
  },
  emits: ['todo-item-created'],
  setup() {
    const client = (inject('client') as ComputedRef<AppAgentClient>).value;
    return {
      client,
    };
  },
})
</script>
