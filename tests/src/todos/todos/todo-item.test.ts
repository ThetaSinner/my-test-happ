import { assert, test } from "vitest";

import { runScenario, pause, CallableCell } from '@holochain/tryorama';
import { NewEntryAction, ActionHash, Record, AppBundleSource, fakeDnaHash, fakeActionHash, fakeAgentPubKey, fakeEntryHash } from '@holochain/client';
import { decode } from '@msgpack/msgpack';

import { createTodoItem, sampleTodoItem } from './common.js';

test('create TodoItem', async () => {
  await runScenario(async scenario => {
    // Construct proper paths for your app.
    // This assumes app bundle created by the `hc app pack` command.
    const testAppPath = process.cwd() + '/../workdir/my-test-happ.happ';

    // Set up the app to be installed 
    const appSource = { appBundleSource: { path: testAppPath } };

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice, bob] = await scenario.addPlayersWithApps([appSource, appSource]);

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents();

    // Alice creates a TodoItem
    const record: Record = await createTodoItem(alice.cells[0]);
    assert.ok(record);
  });
});

test('create and read TodoItem', async () => {
  await runScenario(async scenario => {
    // Construct proper paths for your app.
    // This assumes app bundle created by the `hc app pack` command.
    const testAppPath = process.cwd() + '/../workdir/my-test-happ.happ';

    // Set up the app to be installed 
    const appSource = { appBundleSource: { path: testAppPath } };

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice, bob] = await scenario.addPlayersWithApps([appSource, appSource]);

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents();

    const sample = await sampleTodoItem(alice.cells[0]);

    // Alice creates a TodoItem
    const record: Record = await createTodoItem(alice.cells[0], sample);
    assert.ok(record);

    // Wait for the created entry to be propagated to the other node.
    await pause(1200);

    // Bob gets the created TodoItem
    const createReadOutput: Record = await bob.cells[0].callZome({
      zome_name: "todos",
      fn_name: "get_todo_item",
      payload: record.signed_action.hashed.hash,
    });
    assert.deepEqual(sample, decode((createReadOutput.entry as any).Present.entry) as any);
  });
});

test('create and update TodoItem', async () => {
  await runScenario(async scenario => {
    // Construct proper paths for your app.
    // This assumes app bundle created by the `hc app pack` command.
    const testAppPath = process.cwd() + '/../workdir/my-test-happ.happ';

    // Set up the app to be installed 
    const appSource = { appBundleSource: { path: testAppPath } };

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice, bob] = await scenario.addPlayersWithApps([appSource, appSource]);

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents();

    // Alice creates a TodoItem
    const record: Record = await createTodoItem(alice.cells[0]);
    assert.ok(record);
        
    const originalActionHash = record.signed_action.hashed.hash;
 
    // Alice updates the TodoItem
    let contentUpdate: any = await sampleTodoItem(alice.cells[0]);
    let updateInput = {
      original_todo_item_hash: originalActionHash,
      previous_todo_item_hash: originalActionHash,
      updated_todo_item: contentUpdate,
    };

    let updatedRecord: Record = await alice.cells[0].callZome({
      zome_name: "todos",
      fn_name: "update_todo_item",
      payload: updateInput,
    });
    assert.ok(updatedRecord);

    // Wait for the updated entry to be propagated to the other node.
    await pause(1200);
        
    // Bob gets the updated TodoItem
    const readUpdatedOutput0: Record = await bob.cells[0].callZome({
      zome_name: "todos",
      fn_name: "get_todo_item",
      payload: updatedRecord.signed_action.hashed.hash,
    });
    assert.deepEqual(contentUpdate, decode((readUpdatedOutput0.entry as any).Present.entry) as any);

    // Alice updates the TodoItem again
    contentUpdate = await sampleTodoItem(alice.cells[0]);
    updateInput = { 
      original_todo_item_hash: originalActionHash,
      previous_todo_item_hash: updatedRecord.signed_action.hashed.hash,
      updated_todo_item: contentUpdate,
    };

    updatedRecord = await alice.cells[0].callZome({
      zome_name: "todos",
      fn_name: "update_todo_item",
      payload: updateInput,
    });
    assert.ok(updatedRecord);

    // Wait for the updated entry to be propagated to the other node.
    await pause(1200);
        
    // Bob gets the updated TodoItem
    const readUpdatedOutput1: Record = await bob.cells[0].callZome({
      zome_name: "todos",
      fn_name: "get_todo_item",
      payload: updatedRecord.signed_action.hashed.hash,
    });
    assert.deepEqual(contentUpdate, decode((readUpdatedOutput1.entry as any).Present.entry) as any);
  });
});

test('create and delete TodoItem', async () => {
  await runScenario(async scenario => {
    // Construct proper paths for your app.
    // This assumes app bundle created by the `hc app pack` command.
    const testAppPath = process.cwd() + '/../workdir/my-test-happ.happ';

    // Set up the app to be installed 
    const appSource = { appBundleSource: { path: testAppPath } };

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice, bob] = await scenario.addPlayersWithApps([appSource, appSource]);

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents();

    // Alice creates a TodoItem
    const record: Record = await createTodoItem(alice.cells[0]);
    assert.ok(record);
        
    // Alice deletes the TodoItem
    const deleteActionHash = await alice.cells[0].callZome({
      zome_name: "todos",
      fn_name: "delete_todo_item",
      payload: record.signed_action.hashed.hash,
    });
    assert.ok(deleteActionHash);

    // Wait for the entry deletion to be propagated to the other node.
    await pause(1200);
        
    // Bob tries to get the deleted TodoItem
    const readDeletedOutput = await bob.cells[0].callZome({
      zome_name: "todos",
      fn_name: "get_todo_item",
      payload: record.signed_action.hashed.hash,
    });
    assert.notOk(readDeletedOutput);
  });
});
