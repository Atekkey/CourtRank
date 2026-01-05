import { Platform, Alert  } from 'react-native';

export const myPrint = (message: string, title?: string) => {
    if (title) {
        if (Platform.OS === 'web') {
            window.alert(`${title}: \n${message}`);
        } else {
            Alert.alert(title, `${message}`);
        }
    } else {
        if (Platform.OS === 'web') {
            window.alert(`${message}`);
        } else {
            Alert.alert('CourtRank:', `${message}`);
        }
    }
    
}