import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#e8e8e8',
	},
	container: {
		padding: 12,
	},
	header: {
		backgroundColor: '#000',
		padding: 12,
		borderRadius: 10,
		marginBottom: 12,
	},
	headerContent: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	headerLeft: {
		width: 20,
	},
	headerCenter: {
		flex: 1,
	},
	headerRight: {
		flexDirection: 'row',
		gap: 8,
		alignItems: 'center',
	},
	settingsButton: {
		backgroundColor: '#fff',
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 3,
		borderColor: '#000',
	},
	settingsButtonText: {
		color: '#000',
	},
	imageSquare: {
		backgroundColor: '#fff',
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 3,
		borderColor: '#000',
		overflow: 'hidden',
	},
	dominoImage: {
		width: '100%',
		height: '100%',
	},
	imagePlaceholder: {
		color: '#000',
		fontWeight: '700',
		textAlign: 'center',
	},
	settingsOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 1000,
	},
	settingsPopup: {
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 20,
		width: '80%',
		maxWidth: 400,
		borderWidth: 3,
		borderColor: '#000',
	},
	settingsHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 20,
	},
	settingsTitle: {
		fontWeight: '700',
		color: '#000',
	},
	closeButton: {
		padding: 5,
	},
	closeButtonText: {
		color: '#000',
		fontWeight: '700',
	},
	settingsContent: {
		padding: 10,
	},
	settingsText: {
		color: '#000',
	},
	settingsActionButton: {
		backgroundColor: '#000',
		borderRadius: 10,
		paddingVertical: 10,
		paddingHorizontal: 12,
		borderWidth: 3,
		borderColor: '#000',
		alignItems: 'center',
	},
	settingsActionButtonDisabled: {
		opacity: 0.6,
	},
	settingsActionButtonText: {
		color: '#fff',
		fontWeight: '800',
	},
	headerText: {
		color: '#fff',
		textAlign: 'center',
	},
	headerBold: {
		fontWeight: '700',
	},
	headerSubtext: {
		color: '#fff',
		textAlign: 'center',
		marginTop: 2,
	},
	mainContent: {
		flexDirection: 'row',
		gap: 12,
	},
	leftSection: {
		flex: 1,
	},
	choiceTapsSection: {
		marginBottom: 12,
	},
	choiceHeaderRow: {
		flexDirection: 'row',
		marginBottom: 8,
		gap: 8,
	},
	pawsHeaderCell: {
	},
	choiceHeaderCell: {
		flex: 1,
	},
	choiceHeader: {
		backgroundColor: '#000',
		padding: 10,
		borderRadius: 25,
		alignItems: 'center',
	},
	choiceHeaderText: {
		color: '#fff',
		fontWeight: '700',
	},
	choiceRow: {
		flexDirection: 'row',
		marginBottom: 8,
		gap: 8,
	},
	pawsCell: {
	},
	pawsBox: {
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 3,
		borderColor: '#000',
	},
	pawsLetter: {
		fontWeight: '900',
		color: '#000',
	},
	choiceCell: {
		flex: 1,
	},
	choiceButton: {
		borderRadius: 25,
		justifyContent: 'center',
		paddingHorizontal: 12,
		borderWidth: 3,
		borderColor: '#000',
	},
	choiceButtonActivePositive: {
		backgroundColor: '#4caf50',
	},
	choiceButtonActiveNegative: {
		backgroundColor: '#ef4444',
	},
	choiceButtonText: {
		fontWeight: '700',
		color: '#000',
	},
	choiceButtonTextActive: {
		color: '#fff',
	},
	characterEquation: {
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 8,
		borderWidth: 3,
		borderColor: '#000',
		maxWidth: '85%',
		alignSelf: 'center',
	},
	equationHeader: {
		borderRadius: 20,
		padding: 6,
		marginBottom: 6,
		borderWidth: 2,
		borderColor: '#000',
	},
	equationHeaderText: {
		fontWeight: '700',
		color: '#000',
		textAlign: 'center',
	},
	equationRow: {
		marginBottom: 6,
	},
	equationRowWithSign: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 6,
		gap: 8,
	},
	signText: {
		fontWeight: '900',
		color: '#000',
		width: 30,
	},
	signTextSpacer: {
		width: 30,
	},
	characterBox: {
		borderRadius: 20,
		padding: 8,
		borderWidth: 3,
		borderColor: '#000',
		alignItems: 'center',
	},
	characterBoxWithSign: {
		flex: 1,
	},
	characterText: {
		fontWeight: '700',
		color: '#000',
	},
	resultBox: {
		borderRadius: 20,
		padding: 8,
		borderWidth: 3,
		borderColor: '#000',
		alignItems: 'center',
	},
	resultText: {
		fontWeight: '700',
		color: '#000',
		textAlign: 'center',
	},
	triangleContainer: {
		alignItems: 'flex-end',
	},
	triangleRow: {
		flexDirection: 'row',
	},
	triangleCard: {
		borderRadius: 12,
		padding: 6,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 3,
		borderColor: '#000',
	},
	triangleCardTitle: {
		fontWeight: '700',
		color: '#000',
		textAlign: 'center',
	},
	triangleCardTitleSelected: {
		color: '#fff',
	},
	cardPressed: {
		opacity: 0.8,
	},
	scoreOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(255, 255, 255, 0.95)',
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 9,
	},
	scoreValue: {
		fontWeight: '900',
		color: '#000',
	},
	recentChoiceOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 9,
		padding: 4,
	},
	recentChoiceText: {
		fontWeight: '700',
		color: '#fff',
		textAlign: 'center',
	},
	pressed: {
		opacity: 0.7,
	},
	studentListScroll: {
		maxHeight: 300,
		borderWidth: 2,
		borderColor: '#000',
		borderRadius: 8,
		backgroundColor: '#f5f5f5',
	},
	studentListItem: {
		padding: 12,
		borderBottomWidth: 1,
		borderBottomColor: '#ddd',
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	studentListItemSelected: {
		backgroundColor: '#2d5aa8',
	},
	studentListItemText: {
		color: '#000',
		fontWeight: '600',
	},
	studentListItemTextSelected: {
		color: '#fff',
	},
	studentListItemCheck: {
		color: '#fff',
		fontWeight: '700',
	},
});
