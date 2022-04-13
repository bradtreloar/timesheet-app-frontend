import React, { useEffect, useMemo, useState } from "react";
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
import { Setting, SettingsValues } from "settings/types";
import { merge } from "lodash";
import { entityStateIsIdle } from "store/entity";
import LoadingPage from "common/pages/LoadingPage";

export function useSettingsValues() {
  const { entities } = useSelector(selectSettings);
  const { allIDs: settingIDs, byID: settingsByID } = entities;

  return settingIDs.reduce((settings, id) => {
    const { name, value } = settingsByID[id].attributes;
    settings[name as keyof SettingsValues] = value;
    return settings;
  }, {} as SettingsValues);
}

export function getUpdatedSettings(
  values: SettingsValues,
  settings: Setting[]
): Setting[] {
  const updatedSettings = [] as Setting[];
  settings.forEach((setting) => {
    const settingName = setting.attributes.name as keyof SettingsValues;
    updatedSettings.push(
      merge(setting, {
        attributes: merge(setting.attributes, {
          value: values[settingName],
        }),
      })
    );
  });
  return updatedSettings;
}

const useSettings = () => {
  const dispatch = useThunkDispatch();
  const [isRefreshed, setRefreshed] = useState(false);
  const [settings, setSettings] = useState<Setting[] | null>(null);
  const settingsState = useSelector(selectSettings);

  useEffect(() => {
    if (entityStateIsIdle(settingsState)) {
      if (!isRefreshed) {
        (async () => {
          await dispatch(settingsActions.fetchAll());
          setRefreshed(true);
        })();
      } else {
        const { entities } = settingsState;
        setSettings(entities.allIDs.map((id) => entities.byID[id]));
      }
    }
  }, [isRefreshed, settingsState]);

  return {
    settings,
    error: settingsState.error,
  };
};

const SettingsPage = () => {
  const dispatch = useThunkDispatch();
  const { setMessage } = useMessages();
  const { settings, error } = useSettings();
  const settingsValues = useSettingsValues();

  const { formError, formPending, handleSubmit } = useFormController(
    async (values: SettingsValues) => {
      const updatedSettings = getUpdatedSettings(values, settings as Setting[]);

      for (let setting of updatedSettings) {
        const action = await dispatch(settingsActions.update(setting));
        if (action.type === "settings/update/fulfilled") {
          setMessage("success", "Settings updated successfully.");
        }
      }
    },
    { unmountsOnSubmit: false }
  );

  if (settings === null) {
    return <LoadingPage />;
  }

  return (
    <DefaultLayout>
      <PageTitle>Settings</PageTitle>
      <Messages />
      <div className="container">
        {error && <Alert variant="danger">{error.message}</Alert>}
        {formError && <Alert variant="danger">{formError}</Alert>}
        <SettingsForm
          defaultValues={settingsValues}
          onSubmit={handleSubmit}
          pending={formPending}
        />
      </div>
    </DefaultLayout>
  );
};

export default SettingsPage;
