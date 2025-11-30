import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({

    safeArea: {
        flex: 1,
        backgroundColor: '#f0f7ff',
        position: 'relative',
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
        ...StyleSheet.absoluteFillObject,
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
    closeButtonTextHover: {
        textShadowColor: 'rgba(0, 0, 0, 0.25)',
        textShadowOffset: { width: 0, height: 3 },
        textShadowRadius: 3,
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
    settingsDivider: {
        marginTop: 28,
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
        flex: 1,
    },
    choiceTapsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    bottomRow: {
        flexDirection: 'column',
        gap: 12,
        alignItems: 'flex-end',
        marginTop: 'auto',
    },
    vennDiagramContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        },
    vennDiagramImage: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
        // no border unless you explicitly want one
        },
    directionsBox: {
        backgroundColor: '#000',
        borderRadius: 12,
        padding: 12,
        borderWidth: 3,
        borderColor: '#000',
        alignSelf: 'flex-start',
    },
    directionsText: {
        color: '#fff',
        fontWeight: '600',
        lineHeight: 20,
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
        flexDirection: 'row',
        gap: 64,              // more space between equation + badge
        borderRadius: 16,
        paddingVertical: 16,  // taller overall
        paddingHorizontal: 12,
        maxWidth: '100%',
        alignSelf: 'center',
        alignItems: 'flex-start',
        marginLeft: 16,       // moves the whole block slightly to the right
    },

    equationHeader: {
        borderRadius: 20,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginBottom: 10,
        borderWidth: 3,
        borderColor: '#000',
        alignItems: 'center',
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
        justifyContent: 'center',  // center the sign + box row
        marginBottom: 10,
        gap: 8,
    },
    equationRowLast: {
        marginBottom: 0,
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
        paddingVertical: 12,   // taller
        paddingHorizontal: 10,
        borderWidth: 3,
        borderColor: '#000',
        alignItems: 'center',
    },
    characterBoxWithSign: {
        minWidth: 180,             // narrower than before; tweak this value
        alignSelf: 'center',
    },
    characterText: {
        fontWeight: '700',
        color: '#000',
    },
    resultBox: {
        borderRadius: 20,
        paddingVertical: 14,   // result slightly taller
        paddingHorizontal: 14,
        borderWidth: 3,
        borderColor: '#000',
        alignItems: 'center',
    },
        resultText: {
        fontWeight: '900',       // already max-bold
        color: '#000',
        textAlign: 'center',
        letterSpacing: 0.7,      // optional, adds emphasis
        },
        
    triangleContainer: {
        alignItems: 'flex-end',
        position: 'relative',
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
        borderBottomColor: '#2d5aa8',
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
    badgeImageContainer: {
        alignItems: 'center',
        marginBottom: 8,
    },
    badgeAndLinkColumn: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        alignSelf: 'center',
    },
    badgeImage: {
        width: 180,
        height: 180,
    },
    equationContent: {
        flex: 1,
    },
    videoLinkButton: {
        borderRadius: 15,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderWidth: 2,
        borderColor: '#000',
        alignItems: 'center',
    },
    videoLinkText: {
        color: '#000',
        fontWeight: '700',
    },
    equationDivider: {
        height: 5,              // thickness of the line
        backgroundColor: '#000',// black line
        alignSelf: 'stretch',   // span full width of the equation content
        marginVertical: 10,      // space above/below the line
    },
        characterEquationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16, // space between previous-traits box and equation card
    },
    
    previousTraitsContainer: {
        borderRadius: 16,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderWidth: 3,
        borderColor: '#000',
        minWidth: 220,
    },
    
    previousTraitsLabel: {
        fontWeight: '700',
        color: '#000',
        marginBottom: 4,
    },
    
    previousTraitsEmptyText: {
        color: '#000',
        fontWeight: '500',
        marginTop: 8,
    },
    
    previousTraitsSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 12,
        borderWidth: 3,
        borderColor: '#000',
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#fff',
        marginBottom: 6,
    },
    
    previousTraitsSelectorText: {
        flex: 1,
        color: '#000',
        fontWeight: '600',
    },
    
    previousTraitsSelectorArrow: {
        marginLeft: 8,
        color: '#000',
        fontWeight: '700',
    },
    
    previousTraitsDropdown: {
        marginTop: 6,
        maxHeight: 160,
        borderRadius: 12,
        borderWidth: 3,
        borderColor: '#000',
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    
    previousTraitsOption: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    
    previousTraitsOptionText: {
        color: '#000',
        fontWeight: '600',
        flex: 1,
    },
    
    previousTraitsOptionTextSelected: {
        color: '#111',
        fontWeight: '800',
    },
    
    previousTraitsOptionCheck: {
        color: '#000',
        fontWeight: '800',
        marginLeft: 12,
    },
    previousTraitsGroupHeader: {
        paddingVertical: 4,
        paddingHorizontal: 12,
    },
    
    previousTraitsGroupHeaderText: {
        fontWeight: '700',
        color: '#000',
        textDecorationLine: 'underline',
    },
    previousTraitsSelectedInfo: {
        marginTop: 6,
        marginBottom: 4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    
    previousTraitsSelectedText: {
        fontSize: 12,
        color: '#000',
        fontWeight: '600',
    },
    
    previousTraitsClearButton: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#000',
        backgroundColor: 'rgba(255,255,255,0.9)',
    },
    
    previousTraitsClearButtonText: {
        color: '#000',
        fontWeight: '700',
        fontSize: 12,
    },

    hoverShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 5,
    },

    studentListItemHover: {
        backgroundColor: '#e6edff',
    },
    clearButtonHover: {
        backgroundColor: '#fff',
    },
    dropdownSelectorHover: {
        backgroundColor: '#fff',
    },
    
});
