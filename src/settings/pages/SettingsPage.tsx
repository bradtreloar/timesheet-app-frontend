import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import PageTitle from "common/layouts/PageTitle";
import DefaultLayout from "common/layouts/DefaultLayout";
import {
  selectSettings,
  actions as settingsActions,
} from "settings/store/settings";
import useFormController from "common/forms/useFormController";
import SettingsForm from "settings/forms/SettingsForm";
import { Alert } from "react-bootstrap";
import { useMessages } from "messages/context";
import Messages from "messages/Messages";
import { useThunkDispatch } from "store/createStore";
import { EntityStateData } from "store/types";
import { Setting, Settings } from "settings/types";
import { merge } from "lodash";

export function buildSettings(entities: EntityStateData<Setting>) {
  const { allIDs: settingIDs, byID: settingsByID } = entities;

  return settingIDs.reduce((settings, id) => {
    const { name, value } = settingsByID[id].attributes;
    settings[name as keyof Settings] = value;
    return settings;
  }, {} as Settings);
}

export function getUpdatedSettings(
  values: Settings,
  entities: EntityStateData<Setting>
): Setting[] {
  const { allIDs: settingIDs, byID: settingsByID } = entities;

  const updatedSettings = [] as Setting[];
  settingIDs.forEach((id) => {
    const setting = settingsByID[id];
    const { name, value } = setting.attributes;
    const updatedValue = values[name as keyof Settings];
    updatedSettings.push(
      merge(setting, {
        attributes: merge(setting.attributes, {
          value: updatedValue,
        }),
      })
    );
  });
  return updatedSettings;
}

const SettingsPage = () => {
  const dispatch = useThunkDispatch();
  const { entities, error: settingsStoreError } = useSelector(selectSettings);
  const { setMessage } = useMessages();

  const settings = useMemo(() => {
    return buildSettings(entities);
  }, [entities]);

  const { formError, formPending, handleSubmit } = useFormController(
    async (values: Settings) => {
      const updatedSettings = getUpdatedSettings(values, entities);

      for (let setting of updatedSettings) {
        const action = await dispatch(settingsActions.update(setting));
        if (action.type === "settings/update/fulfilled") {
          setMessage("success", "Settings updated successfully.");
        }
      }
    },
    { unmountsOnSubmit: false }
  );

  return (
    <DefaultLayout>
      <PageTitle>Settings</PageTitle>
      <Messages />
      <div className="container">
        {settingsStoreError && (
          <Alert variant="danger">{settingsStoreError.message}</Alert>
        )}
        {formError && <Alert variant="danger">{formError}</Alert>}
        <SettingsForm
          defaultValues={settings}
          onSubmit={handleSubmit}
          pending={formPending}
        />
      </div>
    </DefaultLayout>
  );
};

export default SettingsPage;
