

export class ListMemberDto implements Readonly<ListMemberDto>{

    spaceId: number;

    members: [
        {
            name: string;
            displayName: string;
        }
    ];
}
