import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CattleSearchResult } from '../api/client';

import MainMenuScreen from '../screens/MainMenuScreen';
import CattleMenuScreen from '../screens/CattleMenuScreen';
import FeedMenuScreen from '../screens/FeedMenuScreen';
import ScanScreen from '../screens/ScanScreen';
import ScanMultipleScreen from '../screens/ScanMultipleScreen';
import AnimalDetailScreen from '../screens/AnimalDetailScreen';
import IDCompanyScreen from '../screens/IDCompanyScreen';
import IDScanScreen from '../screens/IDScanScreen';
import IDConfirmScreen from '../screens/IDConfirmScreen';
import BirthMotherScreen from '../screens/BirthMotherScreen';
import BirthCompanyScreen from '../screens/BirthCompanyScreen';
import BirthScanScreen from '../screens/BirthScanScreen';
import BirthDetailsScreen from '../screens/BirthDetailsScreen';
import DeathScanScreen from '../screens/DeathScanScreen';
import DeathDetailsScreen from '../screens/DeathDetailsScreen';
import WeighScanScreen from '../screens/WeighScanScreen';
import WeighDetailsScreen from '../screens/WeighDetailsScreen';
import WeighResultScreen from '../screens/WeighResultScreen';
import SaleMenuScreen from '../screens/SaleMenuScreen';
import SaleDetailScreen from '../screens/SaleDetailScreen';
import SaleScanScreen from '../screens/SaleScanScreen';
import SaleAnimalScreen from '../screens/SaleAnimalScreen';
import SaleListScreen from '../screens/SaleListScreen';
import PregnancyScanScreen from '../screens/PregnancyScanScreen';
import PregnancyDetailsScreen from '../screens/PregnancyDetailsScreen';
import InseminationMenuScreen from '../screens/InseminationMenuScreen';
import InseminationPrepareScanScreen from '../screens/InseminationPrepareScanScreen';
import InseminationPrepareDetailsScreen from '../screens/InseminationPrepareDetailsScreen';
import InseminationScanScreen from '../screens/InseminationScanScreen';
import InseminationDetailsScreen from '../screens/InseminationDetailsScreen';
import InseminationListScreen from '../screens/InseminationListScreen';
import GroupsMenuScreen from '../screens/GroupsMenuScreen';
import GroupDetailsScreen from '../screens/GroupDetailsScreen';
import GroupScanScreen from '../screens/GroupScanScreen';
import GroupBullListScreen from '../screens/GroupBullListScreen';
import GroupAnimalListScreen from '../screens/GroupAnimalListScreen';
import MedicalMenuScreen from '../screens/MedicalMenuScreen';
import MedicalAddProcedureScreen from '../screens/MedicalAddProcedureScreen';
import MedicalScanScreen from '../screens/MedicalScanScreen';
import MedicalProcedureDetailsScreen from '../screens/MedicalProcedureDetailsScreen';
import MedicalIndividualScreen from '../screens/MedicalIndividualScreen';
import MedicalHistoryScreen from '../screens/MedicalHistoryScreen';
import FatherScreen from '../screens/FatherScreen';
import EditScanScreen from '../screens/EditScanScreen';
import EditDetailsScreen from '../screens/EditDetailsScreen';
import BalesProductionScreen from '../screens/BalesProductionScreen';
import BalesFarmEntryScreen from '../screens/BalesFarmEntryScreen';
import BalesConsumptionScreen from '../screens/BalesConsumptionScreen';
import CerealProductionScreen from '../screens/CerealProductionScreen';
import CerealConsumptionScreen from '../screens/CerealConsumptionScreen';
import CerealSaleScreen from '../screens/CerealSaleScreen';

export type RootStackParamList = {
  MainMenu: undefined;
  CattleMenu: undefined;
  FeedMenu: undefined;
  Father: undefined;
  Scan: { returnTo: string; moduleLabel: string };
  ScanMultiple: { results: CattleSearchResult[]; returnTo: string; moduleLabel: string };
  AnimalDetail: { earTag: string; moduleLabel: string };
  IDCompany: undefined;
  IDScan: { company: string };
  IDConfirm: { company: string; earTag: string };
  BirthMother: undefined;
  BirthCompany: undefined;
  BirthScan: { company: string | null; mother: import('../api/client').MotherInfo | null };
  BirthDetails: { earTag: string; company: string | null; noId: boolean; mother: import('../api/client').MotherInfo | null };
  DeathScan: undefined;
  DeathDetails: { animal: import('../api/client').DeathAnimalInfo };
  WeighScan: undefined;
  WeighDetails: { animal: import('../api/client').WeighAnimalInfo };
  WeighResult: { animal: import('../api/client').WeighAnimalInfo };
  SaleMenu: undefined;
  SaleDetail: { listId: number; listName: string };
  SaleScan: { listId: number; listName: string };
  SaleAnimal: { listId: number; listName: string; animal: import('../api/client').SaleAnimalInfo };
  SaleList: { listId: number; listName: string };
  PregnancyScan: undefined;
  PregnancyDetails: { animal: import('../api/client').PregnancyAnimalInfo };
  InseminationMenu: undefined;
  InseminationPrepareScan: undefined;
  InseminationPrepareDetails: { animal: import('../api/client').InseminationAnimalInfo };
  InseminationScan: undefined;
  InseminationDetails: { animal: import('../api/client').InseminationAnimalInfo };
  InseminationList: { listType: 'prepared' | 'inseminated' };
  GroupsMenu: undefined;
  GroupDetails: { groupName: string; groupColor: string; groupType: string };
  GroupScan: { groupName: string; groupColor: string; action: 'add' | 'remove' };
  GroupBullList: undefined;
  GroupAnimalList: { groupName: string; groupColor: string };
  MedicalMenu: undefined;
  MedicalAddProcedure: { procedure?: import('../api/client').MedicalProcedure } | undefined;
  MedicalScan: { mode: 'procedure' | 'individual'; procedureId?: number; procedureName?: string; medicationName?: string };
  MedicalProcedureDetails: { earTag: string; procedureId: number; procedureName: string; medicationName: string; animalInfo: import('../api/client').MedicalAnimalInfo };
  MedicalIndividual: { earTag: string; animalInfo: import('../api/client').MedicalAnimalInfo };
  MedicalHistory: { earTag?: string } | undefined;
  EditScan: undefined;
  EditDetails: { earTag: string };
  BalesProduction: undefined;
  BalesFarmEntry: undefined;
  BalesConsumption: undefined;
  CerealProduction: undefined;
  CerealConsumption: undefined;
  CerealSale: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="MainMenu">
        <Stack.Screen name="MainMenu" component={MainMenuScreen} />
        <Stack.Screen name="CattleMenu" component={CattleMenuScreen} />
        <Stack.Screen name="FeedMenu" component={FeedMenuScreen} />
        <Stack.Screen name="Father"   component={FatherScreen} />
        <Stack.Screen name="Scan" component={ScanScreen} />
        <Stack.Screen name="ScanMultiple" component={ScanMultipleScreen} />
        <Stack.Screen name="AnimalDetail" component={AnimalDetailScreen} />
        <Stack.Screen name="IDCompany"    component={IDCompanyScreen} />
        <Stack.Screen name="IDScan"       component={IDScanScreen} />
        <Stack.Screen name="IDConfirm"    component={IDConfirmScreen} />
        <Stack.Screen name="BirthMother"  component={BirthMotherScreen} />
        <Stack.Screen name="BirthCompany" component={BirthCompanyScreen} />
        <Stack.Screen name="BirthScan"    component={BirthScanScreen} />
        <Stack.Screen name="BirthDetails" component={BirthDetailsScreen} />
        <Stack.Screen name="DeathScan"    component={DeathScanScreen} />
        <Stack.Screen name="DeathDetails" component={DeathDetailsScreen} />
        <Stack.Screen name="WeighScan"    component={WeighScanScreen} />
        <Stack.Screen name="WeighDetails" component={WeighDetailsScreen} />
        <Stack.Screen name="WeighResult"  component={WeighResultScreen} />
        <Stack.Screen name="SaleMenu"     component={SaleMenuScreen} />
        <Stack.Screen name="SaleDetail"   component={SaleDetailScreen} />
        <Stack.Screen name="SaleScan"     component={SaleScanScreen} />
        <Stack.Screen name="SaleAnimal"   component={SaleAnimalScreen} />
        <Stack.Screen name="SaleList"          component={SaleListScreen} />
        <Stack.Screen name="PregnancyScan"     component={PregnancyScanScreen} />
        <Stack.Screen name="PregnancyDetails"  component={PregnancyDetailsScreen} />
        <Stack.Screen name="InseminationMenu"           component={InseminationMenuScreen} />
        <Stack.Screen name="InseminationPrepareScan"    component={InseminationPrepareScanScreen} />
        <Stack.Screen name="InseminationPrepareDetails" component={InseminationPrepareDetailsScreen} />
        <Stack.Screen name="InseminationScan"           component={InseminationScanScreen} />
        <Stack.Screen name="InseminationDetails"        component={InseminationDetailsScreen} />
        <Stack.Screen name="InseminationList"           component={InseminationListScreen} />
        <Stack.Screen name="GroupsMenu"       component={GroupsMenuScreen} />
        <Stack.Screen name="GroupDetails"     component={GroupDetailsScreen} />
        <Stack.Screen name="GroupScan"        component={GroupScanScreen} />
        <Stack.Screen name="GroupBullList"    component={GroupBullListScreen} />
        <Stack.Screen name="GroupAnimalList"  component={GroupAnimalListScreen} />
        <Stack.Screen name="MedicalMenu"             component={MedicalMenuScreen} />
        <Stack.Screen name="MedicalAddProcedure"     component={MedicalAddProcedureScreen} />
        <Stack.Screen name="MedicalScan"             component={MedicalScanScreen} />
        <Stack.Screen name="MedicalProcedureDetails" component={MedicalProcedureDetailsScreen} />
        <Stack.Screen name="MedicalIndividual"       component={MedicalIndividualScreen} />
        <Stack.Screen name="MedicalHistory"          component={MedicalHistoryScreen} />
        <Stack.Screen name="EditScan"                component={EditScanScreen} />
        <Stack.Screen name="EditDetails"             component={EditDetailsScreen} />
        <Stack.Screen name="BalesProduction"         component={BalesProductionScreen} />
        <Stack.Screen name="BalesFarmEntry"          component={BalesFarmEntryScreen} />
        <Stack.Screen name="BalesConsumption"        component={BalesConsumptionScreen} />
        <Stack.Screen name="CerealProduction"        component={CerealProductionScreen} />
        <Stack.Screen name="CerealConsumption"       component={CerealConsumptionScreen} />
        <Stack.Screen name="CerealSale"              component={CerealSaleScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
